/**
 * Formats a date into a human-readable relative string.
 * @param {Date|string} date - The date to format
 * @returns {string} - e.g., "2 hours ago", "Yesterday at 2:30 PM", "Apr 21, 2026"
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now - d) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

/**
 * Formats a date into a full human-readable string.
 * @param {Date|string} date 
 */
export const formatFullDateTime = (date) => {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
