import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { UpdateFilter } from 'mongodb';

interface Task {
  id: string;
  boardId: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  description?: string;
  deadline?: string | null;
  status: 'To Do' | 'In Progress' | 'Done';
  comments: any[];
}

interface Board {
  id: string;
  name: string;
  created: string;
  tasks: Task[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { taskId } = req.query as { taskId: string };
  const client = await clientPromise;
  const db = client.db('taskboard');

  switch (req.method) {
    case 'PUT':
      try {
        const { boardId, title, priority, description, deadline, status } = req.body;
        if (!boardId) {
          console.error('PUT /api/tasks/[taskId]: Missing boardId', { taskId });
          return res.status(400).json({ error: 'Board ID is required' });
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData['tasks.$.title'] = title;
        if (priority !== undefined) updateData['tasks.$.priority'] = priority;
        if (description !== undefined) updateData['tasks.$.description'] = description;
        if (deadline !== undefined) updateData['tasks.$.deadline'] = deadline;
        if (status !== undefined) updateData['tasks.$.status'] = status;

        if (Object.keys(updateData).length === 0) {
          console.error('PUT /api/tasks/[taskId]: No fields to update', { taskId, boardId });
          return res.status(400).json({ error: 'No fields provided to update' });
        }

        const updateFilter: UpdateFilter<Board> = { $set: updateData };

        const result = await db.collection<Board>('boards').updateOne(
          { id: boardId, 'tasks.id': taskId },
          updateFilter
        );

        if (result.matchedCount === 0) {
          console.error('PUT /api/tasks/[taskId]: No match found', { boardId, taskId });
          return res.status(404).json({ error: 'Task or Board not found' });
        }

        if (result.modifiedCount === 0) {
          console.warn('PUT /api/tasks/[taskId]: Task not modified', { boardId, taskId, updateData });
        }

        return res.status(200).json({ message: 'Task updated' });
      } catch (error) {
        console.error('PUT /api/tasks/[taskId] Error:', error);
        return res.status(500).json({ error: 'Failed to update task', details: (error as Error).message });
      }

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}