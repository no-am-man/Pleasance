// src/components/icons/satoshi-icon.tsx
import type { SVGProps } from 'react';

export function SatoshiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8c-2 0-3 1-3 3s1 3 3 3 2-1 2-3-1-3-2-3" />
        <path d="M8 16c2 0 3-1 3-3s-1-3-3-3-2 1-2 3 1 3 2 3" />
        <path d="M12 6v12" />
    </svg>
  );
}
