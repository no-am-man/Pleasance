
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Budding Leaf */}
      <path d="M12 2a4 4 0 0 0-4 4c0 1.1.4 2.1 1 3" />
      <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 3" />
      
      {/* Open Book */}
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export * from './svg3d-cube';
