'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, CheckSquare, ChevronRight, Trash } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
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

interface Board {
  id: string;
  name: string;
  created: string;
  tasks: Task[];
}

interface BoardListProps {
  boards: Board[];
  onDeleteBoard: (boardId: string) => void;
}

export default function BoardList({ boards, onDeleteBoard }: BoardListProps) {
  const router = useRouter();
  const [deletingBoardIds, setDeletingBoardIds] = useState<Set<string>>(new Set()); // Track multiple deletions

  const getPriorityCount = (board: Board, priority: 'Low' | 'Medium' | 'High') => {
    return board.tasks.filter((task) => task.priority === priority).length;
  };

  const getStatusCount = (board: Board, status: 'To Do' | 'In Progress' | 'Done') => {
    return board.tasks.filter((task) => task.status === status).length;
  };

  const handleDelete = async (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If already deleting this board, prevent additional requests
    if (deletingBoardIds.has(boardId)) return;

    if (!window.confirm('Are you sure you want to delete this board?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setDeletingBoardIds((prev) => new Set(prev).add(boardId));
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete board:', errorData.error);
        alert(`Failed to delete board: ${errorData.error || 'Unknown error'}`);
        return;
      }

      onDeleteBoard(boardId);
      if (window.location.pathname === `/board/${boardId}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('Error deleting board. Please try again.');
    } finally {
      setDeletingBoardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(boardId);
        return newSet;
      });
    }
  };

  if (boards.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6 bg-indigo-50 text-indigo-600 p-4 rounded-full inline-flex">
            <CheckSquare size={28} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No boards yet</h3>
          <p className="text-gray-500 mb-6">Create your first board to start organizing your tasks.</p>
          <div className="animate-bounce mt-4">
            <svg className="h-6 w-6 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7 7 7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {boards.map((board) => (
        <li key={board.id} className="transition-all duration-200">
          <Link href={`/board/${board.id}`} className="block hover:bg-indigo-50 group">
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {board.name.substring(0, 1).toUpperCase()}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                    {board.name}
                  </h3>
                  {board.tasks.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {board.tasks.length} {board.tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                <div className="flex items-center mt-1 text-sm text-gray-500 gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{format(new Date(board.created), 'MMM d, yyyy')}</span>
                  </div>

                  {board.tasks.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>{getStatusCount(board, 'To Do')} to do</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <span>{getStatusCount(board, 'In Progress')} in progress</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>{getStatusCount(board, 'Done')} done</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-200 group-hover:border-indigo-600">
                  <ChevronRight size={18} />
                </div>
                <button
                  onClick={(e) => handleDelete(board.id, e)}
                  disabled={deletingBoardIds.has(board.id)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors border border-red-200 hover:border-red-600 opacity-0 group-hover:opacity-100 ${
                    deletingBoardIds.has(board.id) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label={`Delete board ${board.name}`}
                >
                  {deletingBoardIds.has(board.id) ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <Trash size={18} />
                  )}
                </button>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}