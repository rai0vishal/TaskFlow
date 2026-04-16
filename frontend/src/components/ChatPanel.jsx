import { useState, useEffect, useRef } from 'react';
import { X, Search, Send, User as UserIcon, MessageSquare, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { searchUsers, getConversations, accessConversation, getMessages } from '../api/chat';

export default function ChatPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !activeChat) return;

    socket.emit('joinChat', activeChat._id);

    const handleNewMessage = (msg) => {
      if (msg.conversationId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
      
      // Update snippet in active list
      setConversations((prev) => prev.map(c => 
        c._id === msg.conversationId 
          ? { ...c, lastMessage: msg, updatedAt: new Date().toISOString() } 
          : c
      ).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };

    const handleOnlineUsers = (users) => setOnlineUsers(new Set(users));
    const handleUserOnline = (id) => setOnlineUsers(prev => { const next = new Set(prev); next.add(id); return next; });
    const handleUserOffline = (id) => setOnlineUsers(prev => { const next = new Set(prev); next.delete(id); return next; });

    socket.on('newMessage', handleNewMessage);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket, activeChat]);

  const fetchConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const { data } = await searchUsers(q);
      setSearchResults(data.data);
    } catch(err) {
      console.error(err);
    }
  };

  const startOrAccessChat = async (targetUserId) => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const { data } = await accessConversation(targetUserId);
      const convo = data.data;
      
      // Select it immediately
      setActiveChat(convo);
      
      // Add to conversational list if not exists
      if (!conversations.find((c) => c._id === convo._id)) {
        setConversations([convo, ...conversations]);
      }

      // Fetch message history
      fetchMessages(convo._id);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convoId) => {
    try {
      const { data } = await getMessages(convoId);
      setMessages(data.data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    // Emit via socket immediately
    socket.emit('sendMessage', {
      conversationId: activeChat._id,
      senderId: user._id,
      content: newMessage,
    });

    setNewMessage('');
  };

  // Resolve chat name based on participants excluding self
  const getOtherUser = (convo) => convo.participants?.find(p => p._id !== user._id);
  const getChatName = (convo) => getOtherUser(convo)?.name || 'Unknown';
  const getChatUserId = (convo) => getOtherUser(convo)?._id;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] flex flex-col bg-white dark:bg-surface-900 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.6)] border-l border-surface-200/50 dark:border-white/5 z-50 transform transition-transform duration-300">
      {/* Header */}
      <div className="px-5 py-4 bg-transparent border-b border-surface-200/50 dark:border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <MessageSquare className="w-5 h-5 mb-0.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white leading-tight tracking-wide">Messages</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium mt-0.5">Direct messages</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!activeChat ? (
        /* Conversation List View */
        <div className="flex flex-col h-full bg-white dark:bg-surface-900 relative">
          <div className="px-5 py-4 border-b border-surface-200/50 dark:border-white/5 shrink-0 z-10 bg-surface-50 dark:bg-surface-900/50">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Find a conversation..."
                className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-white/5 border border-transparent rounded-xl text-[15px] text-surface-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1c] focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all outline-none placeholder:text-surface-500"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full">
            {isSearching ? (
              <div className="p-2">
                {searchResults.map(result => (
                  <div key={result._id} onClick={() => startOrAccessChat(result._id)} className="px-3 py-3 hover:bg-surface-100/50 dark:hover:bg-white/5 cursor-pointer rounded-xl mx-2 mb-1 transition-all flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300 ring-2 ring-transparent">
                      <UserIcon className="w-4 h-4" />
                      {onlineUsers.has(result._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0f0f11] rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-white text-sm">{result.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{result.email}</p>
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && <p className="text-center text-surface-400 mt-10 text-sm">No users found</p>}
              </div>
            ) : (
              <div className="py-2 px-2">
                {conversations.length === 0 ? (
                  <p className="text-center text-surface-400 mt-10 text-sm px-8">No active conversations. Search for a user above to start chatting!</p>
                ) : (
                  conversations.map((convo) => {
                    const isOnline = convo && getChatUserId(convo) ? onlineUsers.has(getChatUserId(convo)) : false;

                    return (
                      <div key={convo._id} onClick={() => { setActiveChat(convo); fetchMessages(convo._id); }} className="p-3 hover:bg-surface-100/50 dark:hover:bg-white/5 cursor-pointer rounded-xl mb-0.5 transition-colors relative group flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 dark:from-primary-500/30 dark:to-primary-600/10 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm shadow-sm border border-primary-500/20 dark:border-primary-500/20">
                            {getChatName(convo).charAt(0).toUpperCase()}
                          </div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0f0f11] rounded-full z-10"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className="font-semibold text-sm text-surface-900 dark:text-gray-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{getChatName(convo)}</p>
                            {convo.lastMessage && (
                              <p className="text-[10px] text-surface-400 font-medium ml-2 shrink-0">
                                {new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          {convo.lastMessage && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate tracking-wide">{convo.lastMessage.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active Chat View */
        <div className="flex flex-col h-full bg-surface-50 dark:bg-[#080809]">
          <div className="px-4 py-3.5 bg-white dark:bg-surface-900 border-b border-surface-200/50 dark:border-white/5 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveChat(null)} className="mr-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-2 rounded-full hover:bg-surface-100 dark:hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 dark:from-primary-500/30 dark:to-primary-600/10 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm border border-primary-500/20">
                    {getChatName(activeChat).charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.has(getChatUserId(activeChat)) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0f0f11] rounded-full z-10"></span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-surface-900 dark:text-white text-base tracking-wide leading-none">{getChatName(activeChat)}</p>
                  {onlineUsers.has(getChatUserId(activeChat)) ? (
                    <p className="text-[11px] font-medium text-emerald-500 mt-1">Active now</p>
                  ) : (
                    <p className="text-[11px] font-medium text-surface-400 mt-1">Offline</p>
                  )}
                </div>
              </div>
            </div>
            {/* Close full panel button could go here if needed, keeping simple to match Slack header style */}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 pt-6 relative">
            {messages.map((m, i) => {
              const isSender = m.sender._id === user._id;
              return (
                <div key={i} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isSender ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-sm shadow-[0_4px_14px_rgba(79,70,229,0.25)]' : 'bg-white dark:bg-surface-800/80 text-surface-900 dark:text-gray-100 rounded-bl-sm border border-surface-200/50 dark:border-white/5 shadow-sm'}`}>
                    <p className="text-[15px] leading-relaxed tracking-wide">{m.content}</p>
                    <p className={`text-[10px] mt-1.5 font-medium flex items-center ${isSender ? 'justify-end text-primary-100/90' : 'justify-start text-surface-500 dark:text-surface-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-surface-900 border-t border-surface-200/50 dark:border-white/5 z-10">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Message..."
                  className="w-full px-5 py-3.5 bg-surface-50 dark:bg-surface-950 border border-surface-200/50 dark:border-white/10 rounded-full text-[15px] text-surface-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1c] focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all outline-none placeholder:text-surface-400"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 shrink-0 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 group"
              >
                <Send className="w-5 h-5 ml-0.5 group-hover:-mt-0.5 group-hover:ml-1 transition-all" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
