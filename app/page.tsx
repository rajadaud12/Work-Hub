'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import BoardCreation from './components/BoardCreation';
import BoardList from './components/BoardList';
import { Layout, Plus, AlertCircle, Loader2, LogOut, UserCircle, Grid } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  description?: string;
  deadline?: string;
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
  password: string;
  members: string[];
}

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [joinBoardId, setJoinBoardId] = useState<string>('');
  const [joinPassword, setJoinPassword] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);

    const fetchBoards = async () => {
      try {
        const response = await fetch('/api/boards', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const body = await response.text();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch boards: ${response.statusText} (Status: ${response.status})`);
        }

        const data = JSON.parse(body);
        setBoards(data);
        setError(null);
      } catch (error) {
        console.error('Fetch Boards Error:', error);
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchUser = async () => {
        try {
          const response = await fetch('/api/user', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const user = await response.json();
            setUsername(user.username);
          } else if (response.status === 401) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            router.push('/login');
          } else {
            console.error('Failed to fetch user');
          }
        } catch (error) {
          console.error('Fetch User Error:', error);
        }
      };
      fetchUser();
    }
  }, [router]);

  const createNewBoard = async (boardName: string): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      throw new Error('Unauthorized');
    }

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: boardName }),
      });
      const body = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }
        throw new Error(`Failed to create board: ${response.statusText} (Status: ${response.status})`);
      }

      const { id, password } = JSON.parse(body);
      setBoards((prev) => [...prev, { id, name: boardName, created: new Date().toISOString(), tasks: [], password, members: [] }]);
      setError(null);
      return id;
    } catch (error) {
      console.error('Create Board Error:', error);
      throw error;
    }
  };

  // Updated: Only update state, no DELETE request here
  const handleDeleteBoard = (boardId: string) => {
    setBoards((prev) => prev.filter((board) => board.id !== boardId));
    setError(null);
    if (window.location.pathname === `/board/${boardId}`) {
      router.push('/');
    }
  };

  const handleJoinBoard = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/boards/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ boardId: joinBoardId, password: joinPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join board');
      }

      const newBoard = await response.json();
      setBoards((prev) => [...prev, newBoard]);
      setIsJoinModalOpen(false);
      setJoinBoardId('');
      setJoinPassword('');
      setError(null);
    } catch (error) {
      console.error('Join Board Error:', error);
      setError((error as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null);
    setBoards([]);
    router.push('/login');
  };

  if (isAuthenticated === null || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-xl flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>TaskBoard Hub</title>
        <meta name="description" content="A minimal team collaboration and task management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <Layout className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  TaskBoard Hub
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Grid size={16} />
                Join Board
              </button>
              {username && (
                <div className="flex items-center text-gray-700 px-3 py-1 rounded-full">
                  <UserCircle className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="text-sm font-medium">{username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 hover:shadow transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create a new board</h2>
          </div>
          <BoardCreation onCreateBoard={createNewBoard} />
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Boards</h2>
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600">
                {boards.length > 0 ? `${boards.length} ${boards.length === 1 ? 'board' : 'boards'}` : 'No boards yet'}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
              <p>Loading your boards...</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <div className="mb-3 p-3 bg-gray-50 rounded-full">
                <Grid className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No boards found</p>
              <p className="text-sm text-gray-500">Create a new board or join an existing one</p>
            </div>
          ) : (
            <BoardList boards={boards} onDeleteBoard={handleDeleteBoard} />
          )}
        </div>
      </main>

      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Join a Board</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board ID</label>
                <input
                  type="text"
                  placeholder="Enter board ID"
                  value={joinBoardId}
                  onChange={(e) => setJoinBoardId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter board password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinBoard}
                disabled={!joinBoardId || !joinPassword}
                className={`px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 ${
                  (!joinBoardId || !joinPassword) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Join Board
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white py-6 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              TaskBoard Hub — A minimal team collaboration tool
            </p>
            <div className="flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-medium transition-colors">
                About
              </a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-medium transition-colors">
                Help
              </a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-medium transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}