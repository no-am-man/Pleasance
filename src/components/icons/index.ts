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
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4" />
      <path d="m14 6-4.5 6 4.5 6" />
      <path d="m18 6-4.5 6 4.5 6" />
    </svg>
  );
}

export * from './svg3d-cube';
