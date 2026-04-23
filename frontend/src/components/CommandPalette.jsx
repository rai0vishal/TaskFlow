import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ListTodo, LayoutDashboard, BarChart2, User, FileText } from 'lucide-react';
import { getTasks } from '../api/tasks';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentTasks, setRecentTasks] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && activeWorkspace?._id) {
      setQuery('');
      setSelectedIndex(0);
      // Fetch recent tasks
      getTasks({ workspace: activeWorkspace._id, limit: 5 })
        .then(res => setRecentTasks(res.data?.data?.tasks || []))
        .catch(() => {});
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, activeWorkspace]);

  if (!isOpen || !user) return null;

  const pages = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Tasks Board', url: '/tasks', icon: ListTodo },
    { title: 'Analytics', url: '/analytics', icon: BarChart2 },
    { title: 'Profile', url: '/profile', icon: User }
  ];

  const filteredPages = pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  const filteredTasks = recentTasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
  
  const allItems = [
    ...filteredPages.map(p => ({ ...p, type: 'page' })),
    ...filteredTasks.map(t => ({ ...t, type: 'task' }))
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    }
  };

  const handleSelect = (item) => {
    setIsOpen(false);
    if (item.type === 'page') {
      navigate(item.url);
    } else if (item.type === 'task') {
      // Assuming tasks page handles task selection or you just navigate to /tasks
      navigate(`/tasks?taskId=${item._id}`);
      window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId: item._id } }));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[rgba(13,11,23,0.5)] backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      {/* Backdrop closes on click */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div 
        className="w-full max-w-[560px] bg-bg-card border-[0.5px] border-border rounded-[14px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center px-4 py-3 border-b-[0.5px] border-border">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-heading placeholder:text-text-hint"
            placeholder="Search tasks, pages, and commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-block text-[11px] border border-border rounded-[4px] px-[5px] py-[1px] text-text-muted bg-bg-surface font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-text-muted">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {filteredPages.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 mb-2 text-[11px] font-[600] text-text-hint uppercase tracking-wider">Pages</div>
                  {filteredPages.map((page, idx) => {
                    const globalIdx = allItems.findIndex(i => i === page);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={page.title}
                        onClick={() => handleSelect({ ...page, type: 'page' })}
                        className={`w-full flex items-center px-3 py-2 rounded-[var(--radius-sm)] text-[14px] transition-colors ${
                          isSelected ? 'bg-primary-light text-primary font-[500]' : 'text-text-body hover:bg-bg-surface'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <page.icon className={`w-4 h-4 mr-3 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                        {page.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div>
                  <div className="px-3 mb-2 text-[11px] font-[600] text-text-hint uppercase tracking-wider">Recent Tasks</div>
                  {filteredTasks.map((task, idx) => {
                    const globalIdx = allItems.findIndex(i => i === task);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={task._id}
                        onClick={() => handleSelect({ ...task, type: 'task' })}
                        className={`w-full flex items-center px-3 py-2 rounded-[var(--radius-sm)] text-[14px] transition-colors ${
                          isSelected ? 'bg-primary-light text-primary font-[500]' : 'text-text-body hover:bg-bg-surface'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <FileText className={`w-4 h-4 mr-3 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                        <span className="truncate">{task.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
