import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { createCheckoutSession, getSubscription, handleWebhook } from '../controllers/stripeController.js'

const router = Router()

router.post('/create-checkout-session', optionalAuth, createCheckoutSession)
router.get('/subscription', optionalAuth, getSubscription)

export default router

export { handleWebhook }
