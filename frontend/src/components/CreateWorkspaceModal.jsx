import { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import * as workspaceApi from '../api/workspace';
import { useWorkspace } from '../context/WorkspaceContext';
import toast from 'react-hot-toast';

export default function CreateWorkspaceModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchWorkspaces, setActiveWorkspace } = useWorkspace();

  if (!isOpen) return null;

  const initials = name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await workspaceApi.createWorkspace({ name: name.trim() });
      const newWorkspace = res.data.data;
      toast.success(`Workspace "${name.trim()}" created!`);
      await fetchWorkspaces();
      if (newWorkspace) setActiveWorkspace(newWorkspace);
      setName('');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <FolderPlus className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Create Workspace</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-surface-400 hover:text-surface-700 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Preview */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200/50 dark:border-surface-700/50">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary-500/25 shrink-0">
              {initials || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                {name.trim() || 'Workspace Name'}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                1 member · Just now
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label htmlFor="ws-name" className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
              Workspace Name
            </label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dev Team, Marketing..."
              maxLength={100}
              className="w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-900 dark:text-white placeholder:text-surface-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              autoFocus
            />
            <p className="text-xs text-surface-400 mt-1.5 pl-1">
              This will generate initials: <span className="font-bold text-primary-600 dark:text-primary-400">{initials || '—'}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-500/25 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><FolderPlus className="w-4 h-4" /> Create Workspace</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
