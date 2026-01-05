import express from "express";
import { limiter, authentication } from "../middleware.js"
import { userSignup, userLogin, userLogout, forgotPassword, resetPassword } from "../controllers/usercontroller.js";

const router = express.Router();

router.post("/signup", limiter, userSignup);
router.post("/login", limiter, userLogin);
router.post("/logout", limiter, userLogout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;
