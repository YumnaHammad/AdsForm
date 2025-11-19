import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inventory:leader12@cluster0.earrfsb.mongodb.net/collaborative-form';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
git   console.log('[MONGODB] connectDB called, URI:', MONGODB_URI ? MONGODB_URI.substring(0, 30) + '...' : 'NOT SET');
  
  if (cached.conn) {
    console.log('[MONGODB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MONGODB] Creating new connection to MongoDB...');
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MONGODB] Successfully connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MONGODB] Connection established');
  } catch (e) {
    console.error('[MONGODB] Connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

