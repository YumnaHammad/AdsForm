import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://inventory:leader12@cluster0.earrfsb.mongodb.net/collaborative-form";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

async function connectDB() {
  try {
    const conn = await mongoose.connect(
      MONGODB_URI ||
        "mongodb+srv://inventory:leader12@cluster0.earrfsb.mongodb.net/collaborative-form"
    );
    console.log("Database connected");
  } catch (error) {
    console.log("error connectectind bd");
  }
}

export default connectDB;
