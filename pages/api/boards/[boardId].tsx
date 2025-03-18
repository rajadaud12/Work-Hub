import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    return decoded.id; // Changed from userId to id
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { boardId } = req.query as { boardId: string };
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db('taskboard');

  switch (req.method) {
    case 'GET':
      try {
        const board = await db.collection('boards').aggregate([
          { $match: { id: boardId } },
          {
            $lookup: {
              from: 'users',
              let: { members: "$members" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: [
                        { $toString: "$_id" }, // Convert _id to string
                        "$$members"
                      ]
                    }
                  }
                },
                { $project: { _id: 1, name: 1, email: 1 } }
              ],
              as: 'memberDetails'
            }
          },
          {
            $project: {
              id: 1,
              name: 1,
              created: 1,
              tasks: 1,
              password: 1,
              members: 1,
              memberDetails: {
                $map: {
                  input: "$memberDetails",
                  as: "member",
                  in: {
                    id: "$$member._id",
                    name: "$$member.name",
                    email: "$$member.email"
                  }
                }
              }
            }
          }
        ]).toArray();

        if (board.length === 0) {
          return res.status(404).json({ error: 'Board not found' });
        }

        const boardData = board[0];
        console.log('Board data with memberDetails:', boardData); // Debug log

        if (!boardData.members.includes(userId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        return res.status(200).json(boardData);
      } catch (error) {
        console.error('GET /api/boards/[boardId] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch board' });
      }

    case 'PUT':
      try {
        const board = await db.collection('boards').findOne({ id: boardId });
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }
        if (!board.members.includes(userId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const { name, tasks } = req.body;
        const updateData: any = {};
        if (name) updateData.name = name;
        if (tasks) updateData.tasks = tasks;

        await db.collection('boards').updateOne({ id: boardId }, { $set: updateData });
        return res.status(200).json({ message: 'Board updated' });
      } catch (error) {
        console.error('PUT /api/boards/[boardId] Error:', error);
        return res.status(500).json({ error: 'Failed to update board' });
      }

      case 'DELETE':
  try {
    const board = await db.collection('boards').findOne({ id: boardId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    if (!board.members.includes(userId)) {
      return res.status(403).json({ error: 'Forbidden - Only members can delete this board' });
    }
    await db.collection('boards').deleteOne({ id: boardId });
    return res.status(200).json({ message: 'Board deleted' });
  } catch (error) {
    console.error('DELETE /api/boards/[boardId] Error:', error);
    return res.status(500).json({ error: 'Failed to delete board' });
  }
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}