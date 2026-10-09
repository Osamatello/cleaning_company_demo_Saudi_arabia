import React from 'react';

/** FreshSpaces mark: a drop of water with a home's roofline inside — clean water, clean home. */
export default function BrandMark({
  size = 40,
  className = '',
  variant = 'color',
}: {
  size?: number;
  className?: string;
  /** 'white': a white drop with a blue house, for use on the brand blue */
  variant?: 'color' | 'white';
}) {
  const id = React.useId().replace(/:/g, '');
  if (variant === 'white') {
    return (
      <svg width={size} height={size} viewBox="0 0.85 40 40" fill="none" aria-hidden className={className}>
        <path d="M20 3.5C20 3.5 7 17.2 7 25.2a13 13 0 0 0 26 0C33 17.2 20 3.5 20 3.5Z" fill="#ffffff" />
        <path d="M12.6 23.4c.5-2.3 1.9-4.7 3.5-6.7" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13.5 27.5 20 21.4l6.5 6.1M15.6 25.6v5.2h8.8v-5.2" stroke="#0284c7" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0.85 40 40" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-drop`} x1="10" y1="4" x2="30" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#0284c7" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      {/* the drop */}
      <path d="M20 3.5C20 3.5 7 17.2 7 25.2a13 13 0 0 0 26 0C33 17.2 20 3.5 20 3.5Z" fill={`url(#${id}-drop)`} />
      {/* shine on the glass of water */}
      <path d="M12.6 23.4c.5-2.3 1.9-4.7 3.5-6.7" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      {/* the home inside it: roof and walls in one stroke */}
      <path d="M13.5 27.5 20 21.4l6.5 6.1M15.6 25.6v5.2h8.8v-5.2" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
