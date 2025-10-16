import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import swaggerUi from "swagger-ui-express"

import { errorMiddleware } from "../../../packages/error-handler/error-middleware"
import router from "./routes/auth.router"

const swaggerDocument = require("./swagger-output.json")

const app = express()

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

app.get("/", (_, res) => {
  res.send({ message: "Hello API" })
})

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get("/docs-json", (_, res) => {
  res.json(swaggerDocument)
})

// Routes
app.use("/api", router)

app.use(errorMiddleware)

const port = process.env.PORT ? Number(process.env.PORT) : 6001
const server = app.listen(port, () => {
  console.log(`Auth service is running at http://localhost:${port}/api`)
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`)
})

server.on("error", (err) => {
  console.error("Server error:", err)
})
