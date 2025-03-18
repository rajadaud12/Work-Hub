import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('taskboard');
    const usersCollection = db.collection('users');
    
    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user - let MongoDB generate the _id
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    return res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}