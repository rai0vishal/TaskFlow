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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-800 p-8 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Invite Team Member</h2>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
            Expand your team in <span className="text-primary-600 dark:text-primary-400 font-bold">{workspace?.name}</span>
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-6">
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
          
          <div className="pt-2 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">
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
  );
}
