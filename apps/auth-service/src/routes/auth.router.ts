import express, { type Router } from "express"
import {
  loginUser,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
  verifyUserForgotPasswordOtp,
} from "../controllers/auth-controller"

const router: Router = express.Router()

router.post("/user-registration", userRegistration)
router.post("/verify-user", verifyUser)
router.post("/login-user", loginUser)
router.post("/forgot-user-password", userForgotPassword)
router.post("/reset-password-user", resetUserPassword)
router.post("/verify-user-forgot-password-otp", verifyUserForgotPasswordOtp)

export default router
