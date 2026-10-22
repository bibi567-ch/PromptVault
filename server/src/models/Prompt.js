import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    version: { type: Number, required: true },
    savedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const promptSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    category: {
      type: String,
      required: true,
      enum: ["Desarrollo", "Marketing", "Diseno", "Educacion", "Productividad", "Otro"]
    },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    version: { type: Number, default: 1 },
    versions: { type: [versionSchema], default: [] }
  },
  { timestamps: true }
);

promptSchema.index({ visibility: 1, createdAt: -1 });
promptSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model("Prompt", promptSchema);
