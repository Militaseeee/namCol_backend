import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const dbConnection = async () => {
  try {
    const mongodbAtlas = process.env.DB_MONGO;
    await mongoose.connect(mongodbAtlas);
  } catch (error) {
    process.exit(1);
  }
};