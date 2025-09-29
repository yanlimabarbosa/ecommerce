import express from 'express';
import cors from "cors"

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))

app.get('/', (_, res) => {
    res.send({ 'message': 'Hello API'});
});

const port = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
})

server.on('error', (err) => {
    console.error("Server error:", err);
});