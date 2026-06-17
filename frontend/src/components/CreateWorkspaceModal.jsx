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

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-body)',
    border: '0.5px solid var(--color-border)',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  };

  const inputFocusProps = {
    onFocus: (e) => {
      e.target.style.borderColor = 'var(--color-primary)';
      e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)';
    },
    onBlur: (e) => {
      e.target.style.borderColor = 'var(--color-border)';
      e.target.style.boxShadow = 'none';
    },
  };

  const labelStyle = { 
    display: 'block', 
    fontSize: '13px', 
    fontWeight: 600, 
    color: 'var(--color-text-heading)', 
    marginBottom: '6px', 
    marginLeft: '2px' 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md flex flex-col border border-surface-200 dark:border-surface-800 rounded-[1.5rem] shadow-2xl shadow-surface-500/20 dark:shadow-black/40 animate-in fade-in zoom-in duration-200 overflow-hidden" 
        style={{ background: 'var(--color-bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text-heading)' }}>
              Create Workspace
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ background: 'var(--color-bg-card)' }}>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Preview Card */}
            <div 
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ 
                background: 'var(--color-bg-surface)', 
                borderColor: 'var(--color-border)' 
              }}
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  boxShadow: '0 4px 14px 0 rgba(108,99,255,0.25)'
                }}
              >
                {initials || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-heading)' }}>
                  {name.trim() || 'Workspace Name'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  1 member · Just now
                </p>
              </div>
            </div>

            {/* Input Field */}
            <div>
              <label htmlFor="ws-name" style={labelStyle}>Workspace Name</label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                {...inputFocusProps}
                placeholder="e.g. Dev Team, Marketing..."
                maxLength={100}
                required
                autoFocus
              />
              <p className="text-xs mt-1.5 pl-1" style={{ color: 'var(--color-text-muted)' }}>
                This will generate initials: <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{initials || '—'}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-4" style={{ borderTop: '0.5px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-body)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 flex items-center gap-2"
                style={{ 
                  background: 'var(--color-primary)', 
                  color: 'white',
                  boxShadow: '0 4px 14px 0 rgba(108,99,255,0.39)'
                }}
                onMouseEnter={(e) => {
                  if(!loading && name.trim()) e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  if(!loading && name.trim()) e.currentTarget.style.filter = 'brightness(1)';
                }}
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
    </div>
  );
}
