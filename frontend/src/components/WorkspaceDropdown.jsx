import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, MessageSquare } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { Settings } from 'lucide-react';

/**
 * Generate workspace initials from name
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 1)
    .join('');
}

/**
 * Format relative time
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function WorkspaceDropdown() {
  const {
    activeWorkspace,
    setActiveWorkspace,
    workspaces,
    unreadCounts,
    totalUnread,
    setIsSettingsOpen,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!workspaces || workspaces.length === 0) {
    return (
      <>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Workspace
        </button>
        <CreateWorkspaceModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      </>
    );
  }

  const activeInitials = getInitials(activeWorkspace?.name);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button — FIX 11: simplified badge */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: '0.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'border-color 200ms ease, color 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-text-heading)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-body)';
            }
          }}
        >
          {/* Initials Avatar */}
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-white text-[9px] font-[700] shrink-0">
            {activeInitials}
          </div>

          {/* Name (hidden on mobile via CSS class) */}
          <span className="ws-badge-name truncate max-w-[120px]">
            {activeWorkspace?.name || 'Select'}
          </span>

          {/* Unread Badge (total) */}
          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-[9px] font-[700] text-white rounded-full">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}

          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-80 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_60px_rgba(0,0,0,0.6)] border rounded-2xl overflow-hidden z-50 transform origin-top-left" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Workspaces</p>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="p-1.5 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-surface-800 rounded-lg transition-all flex items-center gap-1.5 group/settings"
              >
                <Settings className="w-3.5 h-3.5 group-hover/settings:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-bold">Settings</span>
              </button>
            </div>

            {/* Workspace List */}
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {workspaces.map((ws) => {
                const isActive = activeWorkspace?._id === ws._id;
                const initials = getInitials(ws.name);
                const unread = unreadCounts[ws._id] || 0;
                const lastMsg = ws.lastMessage;

                return (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 group"
                    style={{ background: isActive ? 'var(--color-bg-surface)' : 'transparent' }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-page)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm" style={{
                      background: isActive ? 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))' : 'var(--color-bg-page)',
                      color: isActive ? 'white' : 'var(--color-text-muted)'
                    }}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: isActive ? 'var(--color-text-heading)' : 'var(--color-text-body)' }}>
                          {ws.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {lastMsg && (
                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-hint)' }}>
                              {timeAgo(lastMsg.createdAt)}
                            </span>
                          )}
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                          )}
                        </div>
                      </div>

                      {/* Last message preview */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs truncate leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                          {lastMsg ? (
                            <><span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{lastMsg.senderName}:</span> {lastMsg.text}</>
                          ) : (
                            <span className="italic" style={{ color: 'var(--color-text-hint)' }}>No messages yet</span>
                          )}
                        </p>

                        {/* Unread badge */}
                        {unread > 0 && !isActive && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-600 text-[10px] font-bold text-white rounded-full shrink-0 shadow-sm">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create new workspace */}
            <div className="border-t p-2" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-page)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-surface)' }}>
                  <Plus className="w-4 h-4" />
                </div>
                Create Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
