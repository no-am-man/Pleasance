import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* The all-seeing eye of God */}
      <circle cx="12" cy="12" r="3" />
      <path d="M20.94 11A8.99 8.99 0 0 0 12 5.06 8.99 8.99 0 0 0 3.06 11" />
      <path d="M3.06 13A8.99 8.99 0 0 0 12 18.94 8.99 8.99 0 0 0 20.94 13" />
      {/* Rays of light, representing divine guidance */}
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

export * from './svg3d-cube';
