// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI loaded:', uri); 

if (!uri) {
  console.error('MONGODB_URI is not defined in .env.local');
  throw new Error('Please add your MongoDB URI to .env.local');
}

const options = {};
let client = new MongoClient(uri, options);
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!(global as any)._mongoClientPromise) {
    console.log('Establishing new MongoDB connection in development...');
    console.log('Connecting with URI:', uri);
    (global as any)._mongoClientPromise = client.connect().then((client) => {
      console.log('MongoDB connected successfully in development');
      return client;
    }).catch((err) => {
      console.error('MongoDB connection failed in development:', err);
      throw err;
    });
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  console.log('Establishing new MongoDB connection in production...');
  console.log('Connecting with URI:', uri);
  clientPromise = client.connect().then((client) => {
    console.log('MongoDB connected successfully in production');
    return client;
  }).catch((err) => {
    console.error('MongoDB connection failed in production:', err);
    throw err;
  });
}

export default clientPromise;