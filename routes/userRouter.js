import express from "express";
import { limiter, authentication } from "../middleware.js"
import { userSignup, userLogin, userLogout, forgotPassword, resetPassword, verifyEmailOtp, resendEmailOtp } from "../controllers/usercontroller.js";

const router = express.Router();

router.post("/signup", limiter, userSignup);
router.post("/login", limiter, userLogin);
router.post("/logout", limiter, userLogout);
router.post("/forgot-password", limiter, forgotPassword);
router.post("/reset-password", limiter, resetPassword);
router.post("/verify-email", limiter, verifyEmailOtp);
router.post("/resend-emailOtp", limiter, resendEmailOtp);


export default router;
