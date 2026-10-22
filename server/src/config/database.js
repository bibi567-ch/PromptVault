import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI no esta definida en el archivo de entorno.");
  }

  await mongoose.connect(uri);
  console.log("Conexion con MongoDB establecida.");
}
