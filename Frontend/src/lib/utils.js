import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence handling.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 * @param {string|Date} date
 * @param {object} options - Intl.DateTimeFormat options
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "Just now")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Get initials from a name string.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Generate a deterministic color from a string (for avatars, labels, etc.)
 */
export function stringToColor(str) {
  if (!str) return 'hsl(220, 60%, 50%)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 55%, 50%)`;
}

/**
 * Delay execution (for mock API calls).
 */
export function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
