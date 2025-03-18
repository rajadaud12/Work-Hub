import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface Comment {
  id: string;
  text: string;
  userId: string;
}

interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  description?: string;
  deadline?: string | null;
  status: 'To Do' | 'In Progress' | 'Done';
  comments: Comment[];
}


const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const getUserIdFromToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid authorization header');
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    console.log('Decoded token:', decoded);
    return decoded.id;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromToken(req);
  
  if (!userId) {
    console.log('Failed authentication, token invalid or expired');
    return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
  }

  console.log('Authenticated user ID:', userId);
  
  const client = await clientPromise;
  const db = client.db('taskboard');

  if (req.method === 'GET') {
    try {
      const boards = await db.collection('boards').find({ 
        members: userId 
      }).toArray();
      
      console.log(`Found ${boards.length} boards for user ${userId}`);
      return res.status(200).json(boards);
    } catch (error) {
      console.error('GET /api/boards Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch boards',
        details: (error as Error).message,
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Board name is required' });
      }
      
      const password = generateRandomPassword();
      const newBoard = {
        id: uuidv4(),
        name,
        created: new Date().toISOString(),
        tasks: [] as Task[], // Specified type
        userId,
        password,
        members: [userId],
      };
      
      await db.collection('boards').insertOne(newBoard);
      console.log(`Created new board: ${newBoard.id} for user ${userId}`);
      
      return res.status(201).json({ id: newBoard.id, password: newBoard.password });
    } catch (error) {
      console.error('POST /api/boards Error:', error);
      return res.status(500).json({
        error: 'Failed to create board',
        details: (error as Error).message,
      });
    }
  }
}