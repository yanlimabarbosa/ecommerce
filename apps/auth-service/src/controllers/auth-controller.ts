import bcrypt from "bcryptjs"
import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { AuthError, ValidationError } from "../../../../packages/error-handler"
import { env } from "../../../../packages/libs/env-validator"
import prisma from "../../../../packages/libs/prisma"
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from "../utils/auth.helper"
import { setCookie } from "../utils/cookies/setCookie"

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

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    if (!(email && password)) {
      throw new ValidationError("Email and password are required!")
    }

    const user = await prisma.users.findUnique({ where: { email } })

    if (!user) {
      throw new AuthError("User doesn't exists!")
    }

    const passwordMatches = await bcrypt.compare(password, user.password ?? "")

    if (!passwordMatches) {
      throw new AuthError("Invalid email or password")
    }

    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15 MINUTES" }
    )

    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7 DAYS" }
    )

    setCookie({ res, name: "refresh_token", value: refreshToken })
    setCookie({ res, name: "access_token", value: accessToken })

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    return next(error)
  }
}
