import path from "node:path"
import dotenv from "dotenv"
import ejs from "ejs"
import nodeMailer, { type TransportOptions } from "nodemailer"
import type Mail from "nodemailer/lib/mailer"

dotenv.config()

type EmailOptions = Mail.Options & Partial<TransportOptions>

type SendEmailParams = {
  to: string
  subject: string
  templateName: string
  data: Record<string, any>
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  data,
}: SendEmailParams) => {
  try {
    const html = await renderEmailTemplate(templateName, data)

    const emailOptions: EmailOptions = {
      from: `<${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    }

    await transporter.sendMail(emailOptions)

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    "apps",
    "auth-service",
    "src",
    "utils",
    "email-templates",
    `${templateName}.ejs`
  )

  return await ejs.renderFile(templatePath, data)
}

const transporter = nodeMailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})
