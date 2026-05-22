// colorUtils.js
// Shared utility for consistent user colors across components.
// Same userId always gets same color — deterministic hash.

const CURSOR_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // yellow
  '#4ade80', // green
  '#60a5fa', // blue
  '#c084fc', // purple
  '#f472b6', // pink
  '#34d399', // emerald
];

export function getUserColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}