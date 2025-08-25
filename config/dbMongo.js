import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const dbConnection = async () => {
  try {
    const mongodbAtlas = process.env.DB_MONGO;
    await mongoose.connect(mongodbAtlas);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ Database error", error);
    process.exit(1);
  }
};