import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import promptRoutes from "./routes/prompts.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET debe configurarse con al menos 32 caracteres.");
}

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Ocurrio un error interno en el servidor." });
});

const port = Number(process.env.PORT) || 4000;
await connectDatabase();
app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
