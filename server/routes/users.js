import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { getMe, updateZip } from '../controllers/userController.js'

const router = Router()

router.use(optionalAuth)
router.get('/me', getMe)
router.patch('/zip', updateZip)

export default router
