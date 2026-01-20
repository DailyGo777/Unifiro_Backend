import express from "express";
import { limiter, authentication } from "../middleware.js"
import { forgotPassword, organizerLogin, organizerLogout, organizerSignup, resendEmailOtp, resetPassword, verifyEmailOtp } from "../controllers/organizerController.js";

const router = express.Router();

router.post("/signup", limiter, organizerSignup)
router.post("/login", limiter, organizerLogin);
router.post("/logout", limiter, organizerLogout);
router.post("/forgot-password", limiter, forgotPassword);
router.post("/reset-password", limiter, resetPassword);
router.post("/verify-email", limiter, verifyEmailOtp);
router.post("/resend-emailOtp", limiter, resendEmailOtp);

export default router;
