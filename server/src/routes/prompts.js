import { Router } from "express";
import mongoose from "mongoose";
import Prompt from "../models/Prompt.js";
import { authenticate, optionalAuthentication } from "../middleware/auth.js";

const router = Router();
const categories = ["Desarrollo", "Marketing", "Diseno", "Educacion", "Productividad", "Otro"];

function validPromptInput(body) {
  return (
    typeof body.title === "string" &&
    body.title.trim().length > 0 &&
    body.title.trim().length <= 120 &&
    typeof body.content === "string" &&
    body.content.trim().length > 0 &&
    body.content.trim().length <= 10000 &&
    categories.includes(body.category) &&
    ["public", "private"].includes(body.visibility)
  );
}

router.get("/", optionalAuthentication, async (req, res, next) => {
  try {
    const filter = req.user
      ? { $or: [{ visibility: "public" }, { owner: req.user.id }] }
      : { visibility: "public" };
    const prompts = await Prompt.find(filter)
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({
      prompts: prompts.map((prompt) => ({
        ...prompt,
        voteCount: prompt.votes.length,
        hasVoted: req.user ? prompt.votes.some((id) => id.toString() === req.user.id) : false,
        isOwner: req.user ? prompt.owner._id.toString() === req.user.id : false
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    if (!validPromptInput(req.body)) {
      return res.status(400).json({ message: "Completa los campos con valores validos." });
    }
    const prompt = await Prompt.create({
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category,
      visibility: req.body.visibility,
      owner: req.user.id
    });
    return res.status(201).json({ prompt });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Identificador de prompt invalido." });
    }
    if (!validPromptInput(req.body)) {
      return res.status(400).json({ message: "Completa los campos con valores validos." });
    }
    const prompt = await Prompt.findOne({ _id: req.params.id, owner: req.user.id });
    if (!prompt) {
      return res.status(404).json({ message: "No se encontro un prompt editable." });
    }
    if (prompt.content !== req.body.content.trim()) {
      prompt.versions.push({ content: prompt.content, version: prompt.version });
      prompt.version += 1;
    }
    prompt.title = req.body.title.trim();
    prompt.content = req.body.content.trim();
    prompt.category = req.body.category;
    prompt.visibility = req.body.visibility;
    await prompt.save();
    return res.json({ prompt });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Identificador de prompt invalido." });
    }
    const prompt = await Prompt.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!prompt) {
      return res.status(404).json({ message: "No se encontro un prompt que puedas eliminar." });
    }
    return res.json({ message: "Prompt eliminado." });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/vote", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Identificador de prompt invalido." });
    }
    const prompt = await Prompt.findOne({ _id: req.params.id, visibility: "public" });
    if (!prompt) {
      return res.status(404).json({ message: "No se encontro un prompt publico." });
    }
    if (prompt.owner.toString() === req.user.id) {
      return res.status(403).json({ message: "No puedes votar por tu propio prompt." });
    }
    const previousVote = prompt.votes.findIndex((id) => id.toString() === req.user.id);
    if (previousVote >= 0) {
      prompt.votes.splice(previousVote, 1);
    } else {
      prompt.votes.push(new mongoose.Types.ObjectId(req.user.id));
    }
    await prompt.save();
    return res.json({ voteCount: prompt.votes.length, hasVoted: previousVote < 0 });
  } catch (error) {
    return next(error);
  }
});

export default router;
