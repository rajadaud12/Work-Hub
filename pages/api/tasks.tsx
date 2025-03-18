import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { UpdateFilter } from 'mongodb'; 

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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
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

  switch (req.method) {
    case 'POST':
      try {
        const { boardId, title, priority, description, deadline, status } = req.body;
        if (!boardId || !title) {
          return res.status(400).json({ error: 'Board ID and title are required' });
        }

        const newTask: Task = {
          id: uuidv4(),
          boardId,
          title,
          priority: priority || 'Medium',
          description,
          deadline: deadline || null,
          status: status || 'To Do',
          comments: [],
        };

        const board = await db.collection<Board>('boards').findOne({ id: boardId });
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }

        // Use UpdateFilter to properly type the $push operation
        const updateFilter: UpdateFilter<Board> = {
          $push: {
            tasks: newTask,
          },
        };

        const result = await db.collection<Board>('boards').updateOne(
          { id: boardId },
          updateFilter
        );

        if (result.matchedCount === 0) {
          return res.status(500).json({ error: 'Failed to update board with new task' });
        }

        return res.status(201).json({ id: newTask.id });
      } catch (error) {
        console.error('POST /api/tasks Error:', error);
        return res.status(500).json({ error: 'Failed to create task' });
      }

    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}