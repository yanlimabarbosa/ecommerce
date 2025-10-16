import dotenv from "dotenv"
import { z } from "zod"

// Load environment variables from .env file
dotenv.config()

/**
 * Define and validate environment variables using Zod
 */
const envSchema = z.object({
  // MongoDB Configuration
  MONGO_USERNAME: z.string().min(1, "MONGO_USERNAME is required"),
  MONGO_PASSWORD: z.string().min(1, "MONGO_PASSWORD is required"),
  MONGO_DATABASE: z.string().min(1, "MONGO_DATABASE is required"),
  MONGO_PORT: z.coerce.number().default(27_017),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Redis Configuration
  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().min(1, "REDIS_PASSWORD is required"),

  // SMTP Configuration
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  SMTP_PORT: z.coerce.number(),
  SMTP_SERVICE: z.string().min(1, "SMTP_SERVICE is required"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),

  // Authentication Configuration
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),

  // Optional: Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

/**
 * Validate environment variables at startup
 */
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Environment validation failed:")
  for (const issue of parsed.error.issues) {
    const field = issue.path.length ? issue.path.join(".") : "root"
    console.error(`  - ${field}: ${issue.message}`)
  }
  console.error(
    "\nPlease check your .env file and ensure all required variables are set correctly."
  )
  process.exit(1)
}

/**
 * Export validated and typed environment variables
 */
export const env = parsed.data
export type Env = typeof env
