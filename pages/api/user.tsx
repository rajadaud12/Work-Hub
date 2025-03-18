import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if id exists in the decoded token
    if (!decoded || !decoded.id) {
      console.error('Token payload missing id field:', decoded);
      return res.status(400).json({ error: 'Token payload missing id field' });
    }

    const userId = decoded.id;
    
    // Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      console.error('Invalid MongoDB ObjectId format:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Connect to the database and find the user
    const client = await clientPromise;
    const db = client.db('taskboard');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      console.error('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Return only necessary user data
    res.status(200).json({
      id: user._id.toString(),
      username: user.name || user.username, // Handle both field possibilities
      email: user.email
    });
  } catch (error) {
    console.error('User API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}