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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 10c0-2.5 2-2.5 4-2.5s4 .5 4 2.5-2 2.5-4 2.5-4-.5-4-2.5z" />
      <path d="M14 14c0 2.5-2 2.5-4 2.5s-4-.5-4-2.5 2-2.5 4-2.5 4 .5 4 2.5z" />
      <path d="M12 6v12" />
    </svg>
  );
}
