'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch } from '../../utils/authFetch';
import TaskColumn from '../../components/TaskColumn';
import TaskModal from '../../components/TaskModal';
import ShareBoardModal from '../../components/ShareBoardModal';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';

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

interface MemberDetail {
  id: string;
  name: string;
  email: string;
}

interface Board {
  id: string;
  name: string;
  created: string;
  tasks: Task[];
  password: string;
  members: string[];
  memberDetails: MemberDetail[];
}

export default function BoardDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState<boolean>(false);

  const statusColumns: Array<'To Do' | 'In Progress' | 'Done'> = ['To Do', 'In Progress', 'Done'];

  const taskStats = useMemo(() => {
    if (!board) return null;
    
    const total = board.tasks.length;
    const completed = board.tasks.filter(task => task.status === 'Done').length;
    const inProgress = board.tasks.filter(task => task.status === 'In Progress').length;
    const todo = board.tasks.filter(task => task.status === 'To Do').length;
    const highPriority = board.tasks.filter(task => task.priority === 'High').length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, todo, highPriority, completionRate };
  }, [board]);

  useEffect(() => {
    if (!id) return;

    const fetchBoard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await authFetch(`/api/boards/${id}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 404) {
            setError('Board not found');
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch board');
        }
        const data = await response.json();
        setBoard(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch Board Error:', err);
        setError('Failed to load board data. Please try again.');
        setIsLoading(false);
      }
    };
    fetchBoard();
  }, [id, router]);

  const addTask = async (taskData: Omit<Task, 'id' | 'comments'>) => {
    try {
      const response = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: id, ...taskData }),
      });
      if (!response.ok) throw new Error('Failed to add task');
      const { id: newTaskId } = await response.json();
      setBoard((prev) => ({
        ...prev!,
        tasks: [...prev!.tasks, { id: newTaskId, ...taskData, comments: [] }],
      }));
      return true;
    } catch (err) {
      console.error('Add Task Error:', err);
      return false;
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: id, ...taskData }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      setBoard((prev) => ({
        ...prev!,
        tasks: prev!.tasks.map((task) =>
          task.id === taskId ? { ...task, ...taskData } : task
        ),
      }));
      return true;
    } catch (err) {
      console.error('Update Task Error:', err);
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      setBoard((prev) => ({
        ...prev!,
        tasks: prev!.tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ),
      }));
      
      const response = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: id, status: newStatus }),
      });
      
      if (!response.ok) {
        setBoard((prev) => ({
          ...prev!,
          tasks: prev!.tasks.map((task) =>
            task.id === taskId ? { ...task, status: task.status } : task
          ),
        }));
        throw new Error('Failed to update task status');
      }
      return true;
    } catch (err) {
      console.error('Update Task Status Error:', err);
      return false;
    }
  };

  const addComment = async (taskId: string, content: string) => {
    if (!content.trim()) return false;
    
    try {
      const tempId = `temp-${Date.now()}`;
      setBoard((prev) => ({
        ...prev!,
        tasks: prev!.tasks.map((task) =>
          task.id === taskId
            ? {
              ...task,
              comments: [
                ...task.comments,
                { id: tempId, content, createdAt: new Date().toISOString() },
              ],
            }
            : task
        ),
      }));
      
      const response = await authFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: id, taskId, content }),
      });
      
      if (!response.ok) {
        setBoard((prev) => ({
          ...prev!,
          tasks: prev!.tasks.map((task) =>
            task.id === taskId
              ? {
                ...task,
                comments: task.comments.filter(comment => comment.id !== tempId),
              }
              : task
          ),
        }));
        throw new Error('Failed to add comment');
      }
      
      const { id: commentId } = await response.json();
      
      setBoard((prev) => ({
        ...prev!,
        tasks: prev!.tasks.map((task) =>
          task.id === taskId
            ? {
              ...task,
              comments: task.comments.map(comment => 
                comment.id === tempId 
                  ? { ...comment, id: commentId }
                  : comment
              ),
            }
            : task
        ),
      }));
      
      return true;
    } catch (err) {
      console.error('Add Comment Error:', err);
      return false;
    }
  };

  const openTaskModal = (task: Partial<Task> | null = null) => {
    setEditingTask(task as Task | null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'comments'>) => {
    let success;
    if (editingTask?.id) {
      success = await updateTask(editingTask.id, taskData);
    } else {
      success = await addTask(taskData);
    }
    
    if (success) {
      closeTaskModal();
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading board...</span>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{error || 'Board not found'}</h2>
          <p className="text-gray-600 mb-6">The board you’re looking for doesn’t exist or has been deleted.</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg border border-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{board.name} | TaskBoard Hub</title>
      </Head>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100 mr-3"
                aria-label="Go back"
                title="Return to dashboard"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                  TaskBoard Hub
                </span>
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 font-medium border border-indigo-200">
                  Pro
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 text-sm rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-200"
                title="Share this board with team members"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  ></path>
                </svg>
                Share
              </button>
              <div 
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border border-indigo-700"
                title="Your profile"
              >
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Created on {new Date(board.created).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openTaskModal()}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg border border-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center gap-2 self-start"
                title="Add a new task to this board"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Task
              </button>
              <button
                onClick={() => openTaskModal({ priority: 'High', status: 'To Do' })}
                className="px-3 py-2.5 bg-white text-red-600 rounded-lg border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
                title="Add a high priority task"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <span className="ml-1">Quick Priority</span>
              </button>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg border border-gray-200">
            <button 
              className="w-full px-4 py-3 flex justify-between items-center text-left focus:outline-none"
              onClick={() => setIsDetailExpanded(!isDetailExpanded)}
            >
              <h3 className="text-lg font-semibold text-gray-800">Board Details</h3>
              <svg 
                className={`h-5 w-5 text-gray-500 transition-transform ${isDetailExpanded ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </button>
            
            {isDetailExpanded && (
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Board ID</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-md font-medium text-gray-900">{board.id}</p>
                          <button 
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={() => navigator.clipboard.writeText(board.id)}
                            title="Copy board ID to clipboard"
                          >
                            <svg 
                              className="h-4 w-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Password</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-md font-medium text-gray-900">{board.password}</p>
                          <button 
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={() => navigator.clipboard.writeText(board.password)}
                            title="Copy password to clipboard"
                          >
                            <svg 
                              className="h-4 w-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-2">Team Members</p>
                    {board.memberDetails && board.memberDetails.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {board.memberDetails.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm border border-indigo-100"
                            title={member.name || member.email}
                          >
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.name ? member.name.slice(0, 2).toUpperCase() : member.email.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{member.email}</span>
                          </div>
                        ))}
                        <button 
                          onClick={() => setIsShareModalOpen(true)}
                          className="flex items-center gap-1 px-3 py-1 bg-white text-gray-600 rounded-full text-sm border border-gray-200 hover:bg-gray-50"
                          title="Add more team members"
                        >
                          <svg 
                            className="h-4 w-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            />
                          </svg>
                          <span>Add member</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <p className="text-gray-500 text-sm">No team members yet.</p>
                        <button 
                          onClick={() => setIsShareModalOpen(true)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm underline"
                        >
                          Add members
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {taskStats && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                  <p className="text-xl font-semibold text-gray-800">{taskStats.total}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold text-gray-800">{taskStats.completed}</p>
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                      {taskStats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100">
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="text-xl font-semibold text-gray-800">{taskStats.inProgress}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">High Priority</p>
                  <p className="text-xl font-semibold text-gray-800">{taskStats.highPriority}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusColumns.map((status) => {
            const statusColorMap = {
              'To Do': 'bg-blue-50 border-blue-200 text-blue-800',
              'In Progress': 'bg-amber-50 border-amber-200 text-amber-800',
              'Done': 'bg-emerald-50 border-emerald-200 text-emerald-800',
            };

            return (
              <div key={status} className="flex flex-col h-full">
                <div className={`mb-3 px-4 py-2 rounded-lg ${statusColorMap[status]} inline-flex items-center self-start`}>
                  <span className="font-semibold text-sm">{status}</span>
                  <span className="ml-2 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                    {board.tasks.filter((task) => task.status === status).length}
                  </span>
                </div>

                <div className="" style={{ minHeight: '500px' }}>
                  <TaskColumn
                    title={status}
                    tasks={board.tasks.filter((task) => task.status === status)}
                    onAddTask={() => openTaskModal({ status })}
                    onEditTask={(task) => openTaskModal(task)}
                    onStatusChange={updateTaskStatus}
                    onAddComment={addComment}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {isTaskModalOpen && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            onSubmit={handleTaskSubmit}
            task={editingTask}
          />
        )}
      </AnimatePresence>

      {isShareModalOpen && (
        <ShareBoardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          boardId={board.id}
        />
      )}
    </div>
  );
}