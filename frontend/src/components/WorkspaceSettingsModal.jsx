import React, { useState, useEffect } from 'react';
import { X, Trash2, LogOut, Shield, Save, AlertTriangle, Users, User } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import FormInput from './FormInput';

export default function WorkspaceSettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { activeWorkspace, deleteWorkspace, leaveWorkspace, updateWorkspace } = useWorkspace();
  
  const [name, setName] = useState(activeWorkspace?.name || '');
  const [description, setDescription] = useState(activeWorkspace?.description || '');
  const [confirmText, setConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'members', 'danger'

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace, isOpen]);

  if (!isOpen || !activeWorkspace) return null;

  const isOwner = activeWorkspace.owner?._id === user?._id || activeWorkspace.owner === user?._id;
  const isAdmin = activeWorkspace.members?.find(m => m.user?._id === user?._id || m.user === user?._id)?.role === 'admin';

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateWorkspace(activeWorkspace._id, { name, description });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== activeWorkspace.name) return;
    const success = await deleteWorkspace(activeWorkspace._id);
    if (success) onClose();
  };

  const handleLeave = async () => {
    const success = await leaveWorkspace(activeWorkspace._id);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Heavy Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-surface-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]" style={{ background: 'var(--color-bg-card)' }}>
        
        {/* Header */}
        <div className="shrink-0 px-8 py-6 border-b border-surface-100 dark:border-white/5 flex items-center justify-between" style={{ background: 'var(--color-bg-surface)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'var(--color-primary)' }}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black" style={{ color: 'var(--color-text-heading)' }}>Workspace Settings</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Control Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-body)'; e.currentTarget.style.backgroundColor = 'var(--color-border)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 border-r p-4 flex flex-col gap-1.5" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <button 
              onClick={() => setActiveTab('general')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm"
              style={{ 
                background: activeTab === 'general' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'general' ? 'white' : 'var(--color-text-muted)'
              }}
              onMouseEnter={(e) => { if (activeTab !== 'general') e.currentTarget.style.backgroundColor = 'var(--color-bg-page)'; }}
              onMouseLeave={(e) => { if (activeTab !== 'general') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Shield className="w-4 h-4" /> General
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm"
              style={{ 
                background: activeTab === 'members' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'members' ? 'white' : 'var(--color-text-muted)'
              }}
              onMouseEnter={(e) => { if (activeTab !== 'members') e.currentTarget.style.backgroundColor = 'var(--color-bg-page)'; }}
              onMouseLeave={(e) => { if (activeTab !== 'members') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <User className="w-4 h-4" /> Members
            </button>
            
            <div className="mt-auto pt-4 space-y-1">
              <button 
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'danger' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
              >
                <Trash2 className="w-4 h-4" /> Danger Zone
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--color-bg-card)' }}>
            {activeTab === 'general' && (
              <form onSubmit={handleUpdate} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <FormInput
                    label="Workspace Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Engineering Team"
                    required
                    disabled={!isAdmin}
                    style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-body)' }}
                  />
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl focus:outline-none transition-all min-h-[120px] resize-none text-sm font-medium"
                      style={{ 
                        background: 'var(--color-bg-surface)', 
                        color: 'var(--color-text-body)', 
                        border: '0.5px solid var(--color-border)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-primary)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="What is this workspace for?"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                {isAdmin && (
                  <div className="pt-4">
                    <Button type="submit" isLoading={isUpdating} className="w-full h-12 rounded-2xl shadow-xl shadow-primary-500/20 font-black uppercase tracking-widest text-xs">
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-5 bg-primary-500/[0.05] border border-primary-500/10 rounded-2xl flex items-start gap-4">
                  <Users className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black" style={{ color: 'var(--color-text-heading)' }}>Workspace Members</p>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      To manage team access, use the main team panel on your dashboard.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                   {activeWorkspace.members?.map((member) => (
                     <div key={member.user?._id || member.user} className="p-4 rounded-2xl border flex items-center justify-between group shadow-sm" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase" style={{ background: 'var(--color-bg-page)', color: 'var(--color-primary)' }}>
                           {(member.user?.name || 'U').charAt(0)}
                         </div>
                         <div>
                           <p className="text-sm font-black" style={{ color: 'var(--color-text-heading)' }}>{member.user?.name}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{member.role}</p>
                         </div>
                       </div>
                       {member.user?._id === activeWorkspace.owner?._id && (
                         <span className="px-2 py-1 text-[9px] font-black rounded-lg uppercase tracking-tighter" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>Owner</span>
                       )}
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-5 rounded-2xl flex gap-4" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
                  <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-danger)' }} />
                  <div>
                    <p className="text-sm font-black" style={{ color: 'var(--color-danger)' }}>Careful!</p>
                    <p className="text-xs mt-1 leading-relaxed font-medium" style={{ color: 'var(--color-danger)', opacity: 0.8 }}>
                      Deleting a workspace is a critical action. Archive instead if you're unsure.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {!isOwner && (
                    <div className="p-5 rounded-2xl flex items-center justify-between" style={{ border: '1px solid var(--color-border)' }}>
                      <div>
                        <p className="text-sm font-black" style={{ color: 'var(--color-text-heading)' }}>Leave Workspace</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>You will lose all team access.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleLeave} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)' }}>
                        <LogOut className="w-4 h-4 mr-2" /> Leave
                      </Button>
                    </div>
                  )}

                  {isOwner && (
                    <div className="p-6 rounded-3xl space-y-4" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black" style={{ color: 'var(--color-danger)' }}>Archive Workspace</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)', opacity: 0.8 }}>Moves all data to recovery.</p>
                        </div>
                        <Trash2 className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-xs font-bold"
                          style={{ 
                            background: 'var(--color-bg-card)', 
                            color: 'var(--color-text-body)', 
                            border: '1px solid var(--color-danger-border)' 
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-danger)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(248,113,113,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-danger-border)';
                            e.target.style.boxShadow = 'none';
                          }}
                          placeholder={`Type "${activeWorkspace.name}"`}
                        />
                        <Button 
                          variant="danger" 
                          className="w-full h-12 rounded-2xl shadow-lg font-black uppercase tracking-widest text-xs"
                          disabled={confirmText !== activeWorkspace.name}
                          onClick={handleDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Workspace
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
