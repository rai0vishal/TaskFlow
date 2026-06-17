import React, { useState } from 'react';
import { X, Mail, UserPlus, Loader2 } from 'lucide-react';
import Button from './Button';
import FormInput from './FormInput';
import * as inviteApi from '../api/invites';
import toast from 'react-hot-toast';

export default function InviteModal({ isOpen, onClose, workspace }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !workspace) return;
    
    setLoading(true);
    try {
      await inviteApi.sendInvite({ workspaceId: workspace._id, receiverEmail: email });
      toast.success('Invite sent successfully! 🚀');
      setEmail('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text-heading)' }}>
              Invite Team Member
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
          <form onSubmit={handleInvite} className="p-8 space-y-6">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-body)' }}>
                Expand your team in <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{workspace?.name}</span>
              </p>
            </div>

            <FormInput
              label="Email Address"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
              autoFocus
            />
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-4" style={{ borderTop: '0.5px solid var(--color-border)' }}>
              <Button variant="ghost" className="flex-1" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !email} 
                className="flex-1 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Send Invite
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
