import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import { errorMiddleware } from "../../../packages/error-handler/error-middleware"

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

app.use(errorMiddleware)

const port = process.env.PORT ? Number(process.env.PORT) : 6001
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})

server.on("error", (err) => {
  console.error("Server error:", err)
})
