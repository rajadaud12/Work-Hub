import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { UpdateFilter } from 'mongodb'; // Import UpdateFilter for proper typing

// Define types
interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

interface Task {
  id: string;
  boardId: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  description?: string;
  deadline?: string | null;
  status: 'To Do' | 'In Progress' | 'Done';
  comments: Comment[];
}

interface Board {
  id: string;
  name: string;
  created: string;
  tasks: Task[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('taskboard');

  if (req.method === 'POST') {
    try {
      const { boardId, taskId, content } = req.body;
      if (!boardId || !taskId || !content) {
        return res.status(400).json({ error: 'Board ID, Task ID, and content are required' });
      }

      const newComment: Comment = {
        id: uuidv4(),
        content,
        createdAt: new Date().toISOString(),
      };

      // Type the update operation with UpdateFilter<Board>
      const updateFilter: UpdateFilter<Board> = {
        $push: {
          'tasks.$.comments': newComment,
        },
      };

      const result = await db.collection<Board>('boards').updateOne(
        { id: boardId, 'tasks.id': taskId }, // Match board and specific task
        updateFilter
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Task or Board not found' });
      }

      return res.status(201).json({ id: newComment.id });
    } catch (error) {
      console.error('POST /api/comments Error:', error);
      return res.status(500).json({ error: 'Failed to add comment' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}