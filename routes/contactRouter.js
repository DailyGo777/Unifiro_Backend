import express from 'express'
import { limiter } from '../middleware.js'
import { contactControl } from '../controllers/contactController.js'

const router = express.Router()

router.post("/contact", limiter, contactControl)

export default router;