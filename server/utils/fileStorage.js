import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function filename(req, file, cb) {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_')
    cb(null, `${timestamp}-${safeName}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'))
    }
    cb(null, true)
  },
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
})

export function getUploadsDir() {
  return uploadsDir
}
