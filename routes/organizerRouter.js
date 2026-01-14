import express from "express";
import { limiter, authentication } from "../middleware.js"
import { organizerSignup } from "../controllers/organizerController.js";

const router = express.Router();

router.post("/signup", limiter, organizerSignup)

export default router;
