import { useState, FormEvent, useRef, useEffect } from 'react';
import { format, isAfter, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import React, { JSX } from 'react';

// Define types for the props and data structures
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
  status?: 'To Do' | 'In Progress' | 'Done';
  comments: Comment[];
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onAddComment: (taskId: string, content: string) => void;
}

export default function TaskCard({ task, onEdit, onAddComment }: TaskCardProps) {
  const [isCommentOpen, setIsCommentOpen] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [showAllComments, setShowAllComments] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCommentOpen && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [isCommentOpen]);

  // Priority-based styling
  const priorityConfig: Record<
    Task['priority'],
    { bgColor: string; textColor: string; borderColor: string; icon: JSX.Element }
  > = {
    Low: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      ),
    },
    Medium: {
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    High: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  };

  const getDeadlineStatus = () => {
    if (!task.deadline) return null;
    const now = new Date();
    const deadline = new Date(task.deadline);
    if (isAfter(now, deadline) && !isSameDay(now, deadline)) {
      return { text: 'Overdue', className: 'text-red-600 font-medium' };
    }
    if (isSameDay(now, deadline)) {
      return { text: 'Due today', className: 'text-amber-600 font-medium' };
    }
    return { text: 'Due', className: 'text-gray-500' };
  };

  const deadlineStatus = getDeadlineStatus();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    setIsDragging(true);

    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const ghostElement = element.cloneNode(true) as HTMLElement;
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';
    ghostElement.style.opacity = '0.8';
    ghostElement.style.transform = 'rotate(3deg)';
    ghostElement.style.width = `${rect.width}px`;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, rect.width / 2, 20);

    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 100);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(task.id, comment);
      setComment('');
      setIsCommentOpen(false);
    }
  };

  const displayedComments = showAllComments ? task.comments : task.comments.slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 1 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.98 : 1,
      }}
      transition={{ duration: 0.15 }}
      className={`bg-white border-2 rounded-lg ${
        isDragging
          ? 'border-indigo-200 bg-indigo-50/30'
          : 'border-gray-100 hover:border-indigo-100'
      } transition-all duration-200`}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="p-4 cursor-pointer group"
        onClick={onEdit}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
            {task.title}
          </h4>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
            ${priorityConfig[task.priority].bgColor} ${priorityConfig[task.priority].textColor} border ${priorityConfig[task.priority].borderColor}`}
          >
            {priorityConfig[task.priority].icon}
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2 group-hover:text-gray-800 transition-colors duration-200">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {task.deadline && (
            <div
              className={`text-xs flex items-center p-1.5 px-2 rounded-md bg-gray-50 border border-gray-100 ${deadlineStatus?.className || ''}`}
            >
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {deadlineStatus?.text}: {format(new Date(task.deadline), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {task.comments.length > 0 && (
            <div className="text-xs flex items-center p-1.5 px-2 rounded-md bg-gray-50 border border-gray-100 text-gray-600">
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      </div>

      {task.comments.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {task.comments.length === 1 ? '1 Comment' : `${task.comments.length} Comments`}
            </span>
            {task.comments.length > 2 && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline focus:outline-none"
              >
                {showAllComments ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {displayedComments.map((comment) => (
              <div
                key={comment.id}
                className="text-sm text-gray-700 border-l-2 border-indigo-200 pl-3 py-1 bg-white rounded border-r border-t border-b border-gray-100"
              >
                <p className="mb-1">{comment.content}</p>
                <p className="text-xs text-gray-400 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`border-t border-gray-100 px-4 py-3 ${task.comments.length > 0 ? '' : 'rounded-b-lg'}`}>
        {isCommentOpen ? (
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              ref={commentInputRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all duration-200"
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCommentOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded transition-all duration-200 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!comment.trim()}
                className={`px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 border border-transparent transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  !comment.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentOpen(true);
            }}
            className="w-full py-1.5 flex justify-center items-center text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-all duration-200 border border-transparent hover:border-indigo-100"
          >
            <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Add comment
          </button>
        )}
      </div>
    </motion.div>
  );
}