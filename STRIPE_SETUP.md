# Stripe Subscription Setup

## 1. Create Product and Price in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → **Add product**
2. Name: `TrueCost EOB Access`
3. Price: `$10` / month (recurring)
4. Copy the **Price ID** (e.g. `price_1ABC...`)

## 2. Configure Environment

Add to `.env`:

```
STRIPE_SECRET_KEY=sk_test_xxx          # Stripe → Developers → API keys
STRIPE_PRICE_ID=price_xxx              # From step 1
STRIPE_WEBHOOK_SECRET=whsec_xxx        # From step 4
APP_URL=http://localhost:5173          # Base URL for redirects (default: CORS_ORIGIN)
```

## 3. Run Migration

Add Stripe columns to `users`:

```bash
psql $DATABASE_URL -f server/db/migrations/004_add_stripe_subscription.sql
```

Or in Supabase SQL Editor:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
```

## 4. Webhook for Local Development

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the webhook signing secret (`whsec_xxx`) to `STRIPE_WEBHOOK_SECRET`

## 5. Webhook for Production

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Flow

1. User registers via Auth0 → lands on dashboard
2. ProtectedRoute checks subscription → if none, redirects to `/subscribe`
3. User clicks "Subscribe with Stripe" → POST `/api/stripe/create-checkout-session`
4. Redirects to Stripe Checkout → user pays
5. Stripe redirects to `/dashboard?checkout=success`
6. Webhook fires `checkout.session.completed` → we update `users` with `stripe_customer_id`, `subscription_status = 'active'`
7. User can now access the dashboard

## Dev Bypass

When `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` are not set, subscription checks return `hasAccess: true` (no paywall) for local development.
