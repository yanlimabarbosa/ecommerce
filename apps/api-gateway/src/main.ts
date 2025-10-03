import axios from "axios"
import cookieParser from "cookie-parser"
import cors from "cors"
import express, { type Request } from "express"
import proxy from "express-http-proxy"
import rateLimit from "express-rate-limit"
import morgan from "morgan"

const app = express()

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use(morgan("dev"))
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ limit: "100mb", extended: true }))
app.use(cookieParser())
app.set("trust proxy", 1)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => (req.user ? 1000 : 100), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: true,
  // keyGenerator: (req: Request) => req.ip ?? "unknown",
})

app.use(limiter)

app.get("/gateway-health", (_, res) => {
  res.send({ message: "Welcome to api-gateway!" })
})

app.use("/", proxy("http://localhost:6001"))

const port = process.env.PORT || 8080
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})
server.on("error", console.error)
