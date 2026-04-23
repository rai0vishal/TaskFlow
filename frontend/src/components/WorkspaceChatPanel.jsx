import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import * as chatApi from '../api/chat';


export default function WorkspaceChatPanel({ workspaceId, workspaceName, onClose }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { activeWorkspace, isSwitching } = useWorkspace();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isSwitching) {
      setMessages([]);
      return;
    }
    if (!workspaceId) return;
    fetchMessages();
  }, [workspaceId, isSwitching]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  useEffect(() => {
    if (!socket || !workspaceId) return;

    // Join the workspace chat room
    socket.emit('joinWorkspace', workspaceId);

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      
      // If we are looking at the chat, mark as seen
      if (msg.sender._id !== user._id) {
        chatApi.markMessageSeen(msg._id).catch(err => console.error(err));
      }
    };

    const handleTyping = (userName) => {
      setTypingUser(userName);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    };

    const handleStopTyping = () => {
      setTypingUser(null);
      clearTimeout(typingTimeoutRef.current);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, workspaceId, user]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await chatApi.getWorkspaceMessages(workspaceId);
      setMessages(data.data);
    } catch (err) {
      console.error('Failed to load workspace messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && workspaceId) {
      socket.emit('typing', { workspaceId, userName: user.name });
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    try {
      await chatApi.sendWorkspaceMessage({ workspaceId, text: newMessage });
      setNewMessage('');
      if (socket) {
        socket.emit('stop_typing', { workspaceId });
      }
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }, [newMessage, workspaceId, socket]);

  const handleKeyDown = (e) => {
    // Enter → send message, Shift+Enter → new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  if (!workspaceId) return null;

  return (
    <div className="side-panel flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 bg-bg-surface border-b-[0.5px] border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-[700] text-text-heading leading-tight tracking-wide">{workspaceName || 'Team Chat'}</h2>
            <p className="text-[12px] text-text-muted font-[500] mt-0.5 flex items-center gap-1.5 scrollbar-none overflow-x-auto whitespace-nowrap pb-0.5">
              {activeWorkspace?.members?.map((m, idx) => {
                const isOnline = onlineUsers.includes(m.user._id || m.user);
                return (
                  <span key={m.user._id || m.user} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-surface-400'}`}></span>
                    {m.user.name?.split(' ')[0] || 'Member'}
                    {idx < activeWorkspace.members.length - 1 && <span className="text-text-hint mx-0.5">·</span>}
                  </span>
                )
              })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-heading hover:bg-bg-surface rounded-lg transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col gap-4 p-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} gap-1 animate-pulse`}>
                <div className="h-2 w-12 bg-bg-surface rounded mb-1" />
                <div className={`h-10 w-[70%] bg-bg-surface rounded-[var(--radius-md)] ${i % 2 === 0 ? 'rounded-br-[var(--radius-sm)]' : 'rounded-bl-[var(--radius-sm)]'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-1">
            {/* FIX 9a — Custom empty chat state */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 12.5 3h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading)', marginTop: '12px' }}>No messages yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Say hello to your team</p>
          </div>
        ) : (
          messages.map((m, i) => {
            /* FIX 9b — Guard against orphan timestamps / empty messages */
            if (!m || !m.text) return null;
            const isSender = m.sender._id === user._id;
            return (
              <div key={m._id || i} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                {!isSender && (
                  <span className="text-[10px] text-text-hint font-[600] mb-0.5 ml-1">{m.sender.name}</span>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-[var(--radius-md)] ${
                  isSender 
                    ? 'bg-primary text-white rounded-br-[var(--radius-sm)] shadow-sm' 
                    : 'bg-bg-surface text-text-body rounded-bl-[var(--radius-sm)] border-[0.5px] border-border'
                }`}>
                  <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-[500] text-text-hint">
                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {/* Messages are marked as seen dynamically. Since we simplified the status, we just show "Seen by N" if it's our message. */}
                  {isSender && m.seenBy?.length > 1 && (
                    <span className="text-[9px] font-[500] text-text-hint flex items-center gap-0.5">
                      · Seen by {m.seenBy.length - 1} {m.seenBy.length - 1 === 1 ? 'user' : 'users'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        {typingUser && typingUser !== user.name && (
          <div className="flex items-start">
            <div className="bg-bg-surface px-3.5 py-2 rounded-[var(--radius-md)] rounded-bl-[var(--radius-sm)] border-[0.5px] border-border flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-hint rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-text-hint rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-text-hint rounded-full animate-bounce"></span>
            </div>
            <span className="text-[10px] text-text-hint ml-2 self-center">{typingUser} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — textarea with Enter to send, Shift+Enter for new line */}
      <div className="p-3 bg-bg-card border-t-[0.5px] border-border">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-2 relative border-[0.5px] border-border rounded-[var(--radius-md)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-bg-surface p-1.5 transition-all">
          <textarea
            ref={textareaRef}
            placeholder="Write a message..."
            className="w-full px-3 py-2 bg-transparent text-[13px] text-text-body outline-none placeholder:text-text-hint resize-none overflow-hidden"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-hint pl-3 select-none">
              Enter to send · Shift+Enter for new line
            </span>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-3 py-1.5 bg-primary text-white text-[12px] font-[700] rounded-[var(--radius-sm)] flex items-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
