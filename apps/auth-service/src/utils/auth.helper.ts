import crypto from "node:crypto"
import type { NextFunction } from "express"
import { ValidationError } from "../../../../packages/error-handler"
import redis from "../../../../packages/libs/reddis"
import { sendEmail } from "./send-mail"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
  const { name, email, password, phone_number, country } = data

  if (!(name && email && password) || (userType === "seller" && !(phone_number && country))) {
    throw new ValidationError(`Missing required fields for ${userType} registration.`)
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format.")
  }
}

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(new ValidationError("Please wait 1 minute before requesting a new OTP."))
  }

  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account locked due to multiple failed OTP attempts. Please try again after 30 minutes."
      )
    )
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again.")
    )
  }
}

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`
  const otpRequests = Number((await redis.get(otpRequestKey)) ?? "0")

  const oneHour = 3600

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", oneHour)
    return next(
      new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again.")
    )
  }

  await redis.set(otpRequestKey, otpRequests + 1, "EX", oneHour) // Track requests for 1 hour
}

type SendOtpParams = {
  name: string
  email: string
  templateName: string
}

export const sendOtp = async ({ name, email, templateName }: SendOtpParams) => {
  const otp = crypto.randomInt(1000, 9999).toString()

  await sendEmail({
    to: email,
    subject: "Verify Your Email - OTP Code",
    templateName,
    data: { name, otp },
  })

  await redis.set(`otp:${email}`, otp, "EX", 300) // OTP valid for 5 minutes
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60) // 1 minute cooldown
}
