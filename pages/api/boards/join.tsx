import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

// Define the Board interface
interface Board {
  id: string;
  name: string;
  created: string;
  tasks: unknown[];
  userId: string;
  password: string;
  members: string[];
}

const getUserIdFromToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid authorization header');
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    return decoded.id;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { boardId, password } = req.body;
  if (!boardId || !password) {
    return res.status(400).json({ error: 'Board ID and password are required' });
  }

  const client = await clientPromise;
  const db = client.db('taskboard');

  try {
    // Find the board with proper typing
    const board = await db.collection<Board>('boards').findOne({ id: boardId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    if (board.password !== password) {
      return res.status(403).json({ error: 'Incorrect password' });
    }
    if (board.members.includes(userId)) {
      return res.status(400).json({ error: 'You are already a member of this board' });
    }

    // Add the user to the board's members
    await db.collection<Board>('boards').updateOne(
      { id: boardId },
      { $push: { members: userId } }
    );

    // Fetch the updated board
    const updatedBoard = await db.collection<Board>('boards').findOne({ id: boardId });
    return res.status(200).json(updatedBoard);
  } catch (error) {
    console.error('Join Board Error:', error);
    return res.status(500).json({ error: 'Failed to join board' });
  }
}
