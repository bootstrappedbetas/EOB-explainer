import Stripe from 'stripe'
import { query, getOrCreateUser } from '../db/index.js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const PRICE_ID = process.env.STRIPE_PRICE_ID
const APP_URL = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'

function requireStripe() {
  if (!stripe || !PRICE_ID) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.')
  }
}

/**
 * Create Stripe Checkout Session for subscription.
 * Requires auth. Links auth0_sub and email to the session for webhook handling.
 */
export async function createCheckoutSession(req, res) {
  try {
    const userSub = req.userId
    const userEmail = req.userEmail
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    requireStripe()

    const userId = await getOrCreateUser(userSub, userEmail)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/subscribe?checkout=canceled`,
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: {
        auth0_sub: userSub,
      },
      subscription_data: {
        metadata: { auth0_sub: userSub },
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('createCheckoutSession error', err)
    res.status(500).json({ error: err.message || 'Failed to create checkout session' })
  }
}

/**
 * Get current user's subscription status.
 * When Stripe is not configured, returns hasAccess: true (dev bypass).
 */
export async function getSubscription(req, res) {
  try {
    const userSub = req.userId
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!stripe || !PRICE_ID) {
      return res.json({ status: null, hasAccess: true })
    }

    const result = await query(
      `SELECT stripe_customer_id, stripe_subscription_id, subscription_status
         FROM users
        WHERE auth0_sub = $1`,
      [userSub]
    )

    if (result.rows.length === 0) {
      return res.json({ status: null, hasAccess: false })
    }

    const row = result.rows[0]
    const status = row.subscription_status
    const hasAccess = status === 'active' || status === 'trialing'

    res.json({
      status,
      stripeCustomerId: row.stripe_customer_id,
      hasAccess,
    })
  } catch (err) {
    console.error('getSubscription error', err)
    res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}

/**
 * Stripe webhook handler.
 * Verify signature, handle checkout.session.completed, customer.subscription.updated/deleted.
 */
export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !stripe) {
    console.warn('Stripe webhook not configured')
    return res.status(400).send('Webhook not configured')
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const auth0Sub = session.metadata?.auth0_sub || session.subscription_data?.metadata?.auth0_sub
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (!auth0Sub || !customerId) {
          console.warn('checkout.session.completed missing auth0_sub or customer')
          break
        }

        await query(
          `UPDATE users
             SET stripe_customer_id = $1,
                 stripe_subscription_id = $2,
                 subscription_status = 'active',
                 updated_at = NOW()
           WHERE auth0_sub = $3`,
          [customerId, subscriptionId || null, auth0Sub]
        )
        console.log('Updated user subscription for', auth0Sub)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const status = sub.status === 'canceled' ? 'canceled' : sub.status

        await query(
          `UPDATE users
             SET subscription_status = $1,
                 stripe_subscription_id = CASE WHEN $2 = 'canceled' THEN NULL ELSE stripe_subscription_id END,
                 updated_at = NOW()
           WHERE stripe_subscription_id = $3`,
          [status, status, sub.id]
        )
        console.log('Updated subscription status for', sub.id, 'to', status)
        break
      }

      default:
        // Ignore other events
        break
    }
  } catch (err) {
    console.error('Webhook handler error', err)
    return res.status(500).send('Webhook handler failed')
  }

  res.json({ received: true })
}
