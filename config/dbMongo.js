import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();


export const dbConnection = async () => {
  try {
    const mongodbAtlas = "mongodb+srv://namCol:v4sHbPm079xlZKSN@cluster0.7ibpea6.mongodb.net/recipesDB";
    await mongoose.connect(mongodbAtlas);
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error en la base de datos", error);
    process.exit(1);
  }
};