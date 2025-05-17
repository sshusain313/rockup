import mongoose from 'mongoose';

// Define a default MongoDB URL in case the environment variable is not available
// For local development, use a local MongoDB instance
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/mockey';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

// Define a type for our mongoose connection cache
interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

// Declare the global variable with the correct type
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB with URL:', MONGODB_URL);
    
    cached.promise = mongoose.connect(MONGODB_URL, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB!');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null; // Reset promise on error
        throw error; // Rethrow to be caught by the outer try/catch
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error in dbConnect:', error);
    // Return null and log the error instead of throwing
    cached.promise = null;
    return null;
  }
}

export default dbConnect;
