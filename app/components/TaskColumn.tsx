import { useState, DragEvent, useRef, useEffect } from 'react';
import TaskCard from './TaskCard';
import { motion, AnimatePresence } from 'framer-motion';

// Define types
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

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onAddComment: (taskId: string, content: string) => void;
}

export default function TaskColumn({
  title,
  tasks,
  onAddTask,
  onEditTask,
  onStatusChange,
  onAddComment,
}: TaskColumnProps) {
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [columnHeight, setColumnHeight] = useState<number>(0);

  // Status-based styling
  const getColumnStyles = () => {
    switch (title) {
      case 'To Do':
        return {
          header: 'bg-blue-50 text-blue-800',
          icon: 'text-blue-500',
          dragIndicator: 'ring-blue-400 bg-blue-50',
          addButton: 'text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300'
        };
      case 'In Progress':
        return {
          header: 'bg-amber-50 text-amber-800',
          icon: 'text-amber-500',
          dragIndicator: 'ring-amber-400 bg-amber-50',
          addButton: 'text-amber-600 hover:bg-amber-50 border-amber-200 hover:border-amber-300'
        };
      case 'Done':
        return {
          header: 'bg-emerald-50 text-emerald-800',
          icon: 'text-emerald-500',
          dragIndicator: 'ring-emerald-400 bg-emerald-50',
          addButton: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300'
        };
      default:
        return {
          header: 'bg-gray-50 text-gray-800',
          icon: 'text-gray-500',
          dragIndicator: 'ring-gray-400 bg-gray-50',
          addButton: 'text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
        };
    }
  };

  const styles = getColumnStyles();

  // Get the appropriate icon for the column
  const getColumnIcon = () => {
    switch (title) {
      case 'To Do':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        );
      case 'In Progress':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        );
      case 'Done':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        );
    }
  };

  // Adjust column height on window resize
  useEffect(() => {
    const updateHeight = () => {
      const windowHeight = window.innerHeight;
      // Make column responsive to window height
      setColumnHeight(Math.max(500, windowHeight - 300));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only set to false if we're leaving the column (not entering a child)
    if (columnRef.current && !columnRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, title as Task['status']);
    }
  };

  return (
    <div
      ref={columnRef}
      className={`bg-white rounded-lg border border-gray-200 transition-all duration-200 flex flex-col 
      ${isDraggingOver ? `ring-2 ${styles.dragIndicator} shadow-lg transform scale-101` : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ height: `${columnHeight}px` }}
    >
      <div className={`${styles.header} px-4 py-3 rounded-t-xl flex items-center gap-3 border-b`}>
        <div className={`${styles.icon}`}>
          {getColumnIcon()}
        </div>
        <h3 className="font-medium text-base flex-1">{title}</h3>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-white shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div 
        className="p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-grow"
        style={{ minHeight: '150px' }}
      >
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full py-8 text-gray-400"
            >
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p className="text-sm">No tasks in this column</p>
              <button
                onClick={onAddTask}
                className="mt-3 text-xs underline hover:text-gray-600 transition-colors"
              >
                Add your first task
              </button>
            </motion.div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <TaskCard
                  task={task}
                  onEdit={() => onEditTask(task)}
                  onAddComment={onAddComment}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="border-t px-4 py-3 mt-auto">
        <button
          onClick={onAddTask}
          className={`w-full py-2.5 px-3 flex justify-center items-center text-sm font-medium rounded-lg transition-all duration-200 
          border ${styles.addButton} hover:shadow-sm`}
          aria-label={`Add task to ${title}`}
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      </div>
    </div>
  );
}