import type { NextFunction, Request, Response } from "express"
import { ValidationError } from "../../../../packages/error-handler"
import prisma from "../../../../packages/libs/prisma"
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
} from "../utils/auth.helper"

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user")

    const { name, email } = req.body

    const existingUser = await prisma.users.findUnique({ where: email })

    if (existingUser) {
      return next(new ValidationError("User with this email already exists."))
    }

    await checkOtpRestrictions(email, next)
    await trackOtpRequests(email, next)
    await sendOtp({ name, email, templateName: "user-activation-mail" })

    res
      .status(200)
      .json({ message: "OTP sent to your email. Please verify your account." })
  } catch (err) {
    next(err)
  }
}
