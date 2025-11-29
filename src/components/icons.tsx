import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 12a3 3 0 1 0-3-3" />
      <path d="M15 12a3 3 0 1 0-3-3" />
      <path d="M12 12h.01" />
      <path d="M15 12h.01" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path d="M8 15c.5-1 2-2 4-2s3.5 1 4 2" />
      <path d="m15.5 8.5-3 2.5" />
    </svg>
  );
}
