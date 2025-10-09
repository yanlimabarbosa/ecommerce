import crypto from "node:crypto"
import { ValidationError } from "../../../../packages/error-handler"
import redis from "../../../../packages/libs/reddis"
import { sendEmail } from "./send-mail"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data

  if (
    !(name && email && password) ||
    (userType === "seller" && !(phone_number && country))
  ) {
    throw new ValidationError(
      `Missing required fields for ${userType} registration.`
    )
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format.")
  }
}

export const checkOtpRestrictions = async (email: string) => {
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      "Please wait 1 minute before requesting a new OTP."
    )
  }

  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "Account locked due to multiple failed OTP attempts. Please try again after 30 minutes."
    )
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "Too many OTP requests. Please wait 1 hour before requesting again."
    )
  }
}

export const trackOtpRequests = async (email: string) => {
  const otpRequestKey = `otp_request_count:${email}`
  const otpRequests = Number((await redis.get(otpRequestKey)) ?? "0")

  const oneHour = 3600

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", oneHour)
    throw new ValidationError(
      "Too many OTP requests. Please wait 1 hour before requesting again."
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

type VerifyOtpParams = {
  email: string
  otp: string
}

export const verifyOtp = async ({ email, otp }: VerifyOtpParams) => {
  const storedOtp = await redis.get(`otp:${email}`)

  if (storedOtp !== otp) {
    throw new ValidationError("Invalid or Expired OTP!")
  }

  const failedAttemptsKey = `otp_attempts:${email}`
  const failedAttempts = Number((await redis.get(failedAttemptsKey)) ?? 0)

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      redis.set(`otp_lock:${email}`, "locked", "EX", 1800)
      redis.del(`otp:${email}`, failedAttemptsKey)
      throw new ValidationError(
        "Too many failed attempts. Your account is locked for 30 minutes"
      )
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300)
    throw new ValidationError(
      `Incorrect OTP. ${2 - failedAttempts} attempts left.`
    )
  }

  await redis.del(`otp:${email}`, failedAttemptsKey)
}
