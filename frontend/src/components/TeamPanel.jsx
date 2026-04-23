import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import * as workspaceApi from '../api/workspace';
import * as inviteApi from '../api/invites';
import { customToast as toast } from './ToastSystem'; // assuming we use customToast or just 'react-hot-toast'
import { Users, Mail, UserPlus, Shield, User, X } from 'lucide-react';
import Button from './Button';

export default function TeamPanel({ workspace, onWorkspaceUpdate, onClose }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (workspace) {
      fetchMembers();
    }
  }, [workspace]);

  useEffect(() => {
    if (!socket || !workspace) return;

    const handleMemberAdded = (data) => {
      if (data.workspaceId === workspace._id) {
        setMembers((prev) => [...prev, data.member]);
      }
    };
    const handleRoleUpdated = (data) => {
      if (data.workspaceId === workspace._id) {
        setMembers((prev) => prev.map((m) => m.user._id === data.userId ? { ...m, role: data.role } : m));
      }
    };

    socket.on('member_added', handleMemberAdded);
    socket.on('role_updated', handleRoleUpdated);

    return () => {
      socket.off('member_added', handleMemberAdded);
      socket.off('role_updated', handleRoleUpdated);
    };
  }, [socket, workspace]);

  const fetchMembers = async () => {
    try {
      const { data } = await workspaceApi.getMembers(workspace._id);
      setMembers(data.data.members);
      if (onWorkspaceUpdate) onWorkspaceUpdate(data.data.members);
    } catch (err) {
      toast.error('Failed to fetch members');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await inviteApi.sendInvite({ workspaceId: workspace._id, receiverEmail: email });
      toast.success('Invite sent successfully');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await workspaceApi.changeRole({ workspaceId: workspace._id, userId, role });
      toast.success('Role updated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (!workspace) return null;

  return (
    <div className="side-panel flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 bg-bg-surface border-b-[0.5px] border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-[700] text-text-heading leading-tight tracking-wide">Team Management</h2>
            <p className="text-[12px] text-text-muted font-[500] mt-0.5">{workspace.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-heading hover:bg-bg-surface rounded-[var(--radius-sm)] transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {/* Invite Form */}
        <section>
          <h3 className="text-[12px] font-[700] text-text-hint uppercase tracking-widest mb-4">Invite Member</h3>
          <form onSubmit={handleInvite} className="space-y-3 relative">
            <input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: 'var(--color-bg-surface)',
                border: '0.5px solid var(--color-border)',
                color: 'var(--color-text-body)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '14px',
                width: '100%'
              }}
              className="focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] placeholder:text-text-hint transition-all"
            />
            <Button type="submit" disabled={loading} className="w-full gap-2 px-8 py-3 text-[14px] font-[600] rounded-[var(--radius-sm)] bg-primary text-white border-none transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98]">
              <UserPlus className="w-4 h-4" /> Send Invite
            </Button>
          </form>
        </section>

        {/* Members List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-[700] text-text-hint uppercase tracking-widest">Members</h3>
            <span className="px-2 py-0.5 bg-bg-surface text-text-muted text-[10px] font-[700] rounded-[var(--radius-pill)]">{members.length}</span>
          </div>
          <div className="space-y-3">
            {members.map((m) => {
              /* Avatar colour by first letter (same map as TaskCard FIX 8b) */
              const AVATAR_MAP = {
                A:'purple',B:'purple',C:'purple',D:'purple',E:'purple',
                F:'teal',G:'teal',H:'teal',I:'teal',J:'teal',
                K:'blue',L:'blue',M:'blue',N:'blue',O:'blue',
                P:'amber',Q:'amber',R:'amber',S:'amber',T:'amber',
                U:'pink',V:'pink',W:'pink',X:'pink',Y:'pink',Z:'pink',
              };
              const PALETTE = {
                purple: { bg: '#1E1B35', text: '#A89EF5' },
                teal:   { bg: '#0D2B1A', text: '#4ADE80' },
                blue:   { bg: '#0A1A2E', text: '#60A5FA' },
                amber:  { bg: '#2A1F05', text: '#FBB024' },
                pink:   { bg: '#2A0A1A', text: '#F472B6' },
              };
              const firstLetter = (m.user.name || '?').trim().charAt(0).toUpperCase();
              const palette = PALETTE[AVATAR_MAP[firstLetter] || 'purple'];
              const initials = m.user.name
                ? m.user.name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
                : '?';

              const isAdmin = m.role === 'admin';

              return (
                <div key={m.user._id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-bg-page border-[0.5px] border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: palette.bg,
                        color: palette.text,
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading)' }} className="truncate leading-tight">{m.user.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }} className="truncate mt-0.5">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role badge pill */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        lineHeight: '16px',
                        whiteSpace: 'nowrap',
                        background: isAdmin ? 'var(--color-warning-bg)' : 'var(--color-bg-surface)',
                        color: isAdmin ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        border: isAdmin ? '0.5px solid var(--color-warning-border)' : '0.5px solid var(--color-border)',
                      }}
                    >
                      {m.role}
                    </span>
                    {/* ⋯ action button wrapping the role select */}
                    <div className="relative">
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-surface hover:text-text-heading transition-colors"
                        style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}
                        tabIndex={-1}
                      >
                        ⋯
                      </button>
                      <select
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.user._id, e.target.value)}
                      >
                        <option value="admin">Make Admin</option>
                        <option value="member">Make Member</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
