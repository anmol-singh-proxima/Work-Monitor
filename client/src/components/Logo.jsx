import { useId } from 'react';

export default function Logo({ size = 32 }) {
  const gradientId = `wm-logo-${useId().replace(/:/g, '')}`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="app-logo-mark">
      <circle cx="20" cy="21" r="15" fill={`url(#${gradientId})`} />
      <path
        d="M20 12v9l6 4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="16" y="2" width="8" height="4" rx="2" fill="var(--accent-dark)" />
      <defs>
        <linearGradient id={gradientId} x1="5" y1="6" x2="35" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--accent-light)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-dark)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
