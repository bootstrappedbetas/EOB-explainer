import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { uploadMiddleware } from '../utils/fileStorage.js'
import { getEob, listEobs, summarizeEob, uploadEob } from '../controllers/eobController.js'

const router = Router()

router.use(optionalAuth)

router.get('/', listEobs)
router.get('/:id', getEob)
router.post('/', uploadMiddleware.single('file'), uploadEob)
router.post('/:id/summarize', summarizeEob)

export default router
