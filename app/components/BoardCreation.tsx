'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface BoardCreationProps {
  onCreateBoard: (name: string) => Promise<string>;
}

export default function BoardCreation({ onCreateBoard }: BoardCreationProps) {
  const [boardName, setBoardName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const boardId = await onCreateBoard(boardName);
      setBoardName('');
      router.push(`/board/${boardId}`);
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create board. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
        placeholder="Enter board name"
        className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Board'}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}