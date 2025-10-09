import bcrypt from "bcryptjs"
import type { NextFunction, Request, Response } from "express"
import { ValidationError } from "../../../../packages/error-handler"
import prisma from "../../../../packages/libs/prisma"
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from "../utils/auth.helper"

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user")

    const { name, email } = req.body

    const existingUser = await prisma.users.findUnique({ where: { email } })

    if (existingUser) {
      throw new ValidationError("User with this email already exists.")
    }

    await checkOtpRestrictions(email)
    await trackOtpRequests(email)
    await sendOtp({ name, email, templateName: "user-activation-mail" })

    res
      .status(200)
      .json({ message: "OTP sent to your email. Please verify your account." })
  } catch (err) {
    next(err)
  }
}

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body
    if (!(email && otp && password && name)) {
      throw new ValidationError("All fields are required!")
    }

    const existingUser = await prisma.users.findUnique({ where: { email } })

    if (existingUser) {
      throw new ValidationError("User already exists with this email! ")
    }

    await verifyOtp({ email, otp })

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    })
  } catch (error) {
    return next(error)
  }
}
