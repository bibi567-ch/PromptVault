import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta nuevamente en unos minutos." }
});

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
  res.cookie("promptvault_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return res.status(400).json({
        message: "Ingresa un nombre, un correo valido y una contrasena de al menos 8 caracteres."
      });
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Ese correo ya esta registrado." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    });
    setSessionCookie(res, user._id);
    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Ese correo ya esta registrado." });
    }
    return next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!validPassword) {
      return res.status(401).json({ message: "Correo o contrasena incorrectos." });
    }

    setSessionCookie(res, user._id);
    return res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("promptvault_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.json({ message: "Sesion cerrada." });
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    if (!user) {
      return res.status(401).json({ message: "La cuenta ya no existe." });
    }
    return res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return next(error);
  }
});

export default router;
