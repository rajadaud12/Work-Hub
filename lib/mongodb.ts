import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI loaded:', uri); 

if (!uri) {
  console.error('MONGODB_URI is not defined in .env.local');
  throw new Error('Please add your MongoDB URI to .env.local');
}

const options = {};
const client = new MongoClient(uri, options); // Changed to const
let clientPromise: Promise<MongoClient>;

// Define an interface for the global object with MongoClientPromise
interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = global as unknown as GlobalWithMongo;

if (process.env.NODE_ENV !== 'production') {
  if (!globalWithMongo._mongoClientPromise) {
    console.log('Establishing new MongoDB connection in development...');
    console.log('Connecting with URI:', uri);
    globalWithMongo._mongoClientPromise = client.connect().then((client) => {
      console.log('MongoDB connected successfully in development');
      return client;
    }).catch((err) => {
      console.error('MongoDB connection failed in development:', err);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
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