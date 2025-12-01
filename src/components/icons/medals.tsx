
import type { SVGProps } from 'react';

export function BronzeMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="16" cy="16" r="12" fill="url(#bronze_gradient)" stroke="#8C7853" strokeWidth="2"/>
        <text x="16" y="20" fontFamily="Arial, sans-serif" fontSize="12" fill="#fff" textAnchor="middle">1</text>
        <defs>
            <radialGradient id="bronze_gradient" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D9A470"/>
            <stop offset="100%" stopColor="#8C7853"/>
            </radialGradient>
        </defs>
    </svg>
  );
}

export function SilverMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M16 4L19.09 10.26L26 11.27L21 16.14L22.18 23.02L16 19.77L9.82 23.02L11 16.14L6 11.27L12.91 10.26L16 4Z" fill="url(#silver_gradient)" stroke="#B0B0B0" strokeWidth="1.5" strokeLinejoin="round"/>
        <text x="16" y="18" fontFamily="Arial, sans-serif" fontSize="8" fill="#4A4A4A" textAnchor="middle">2</text>
        <defs>
            <radialGradient id="silver_gradient" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F0F0F0"/>
            <stop offset="100%" stopColor="#A8A8A8"/>
            </radialGradient>
        </defs>
    </svg>
  );
}

export function GoldMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M16,2 L20,12 L30,12 L22,18 L26,28 L16,22 L6,28 L10,18 L2,12 L12,12 L16,2 Z" fill="url(#gold_gradient)" stroke="#FBBF24" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.3)"/>
      <text x="16" y="20" fontFamily="Arial, sans-serif" fontSize="12" fill="#fff" textAnchor="middle">3</text>
       <defs>
            <radialGradient id="gold_gradient" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FDE047"/>
            <stop offset="100%" stopColor="#F59E0B"/>
            </radialGradient>
        </defs>
    </svg>
  );
}

export function PlatinumMedal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M16 2L18.5 9h7L19.5 14l3 7-6.5-4.5L10 21l3-7L7 9h7z" fill="url(#platinum_gradient)" stroke="#94A3B8" strokeWidth="1.5"/>
        <path d="M16 11l1.5 4.5h5L18.5 18l2 5-4.5-3-4.5 3 2-5-4-2.5h5z" fill="url(#platinum_gradient)" opacity="0.7" stroke="#94A3B8" strokeWidth="1"/>
        <text x="16" y="19" fontFamily="Arial, sans-serif" fontSize="10" fill="#2d3748" textAnchor="middle" fontWeight="bold">4</text>
        <defs>
            <radialGradient id="platinum_gradient" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#E0E7FF"/>
                <stop offset="100%" stopColor="#A8B7D2"/>
            </radialGradient>
        </defs>
    </svg>
  );
}
