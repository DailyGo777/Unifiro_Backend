import express from 'express'
import { register, emergeRegistration } from '../controllers/registerControl.js'
import { limiter, upload } from '../middleware.js'

const router = express.Router()

router.post("/register", limiter, register)
router.post("/emergeRegistration", limiter, upload.single("pitchDeck"), emergeRegistration);

export default router