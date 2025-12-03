// src/components/federation-diagram.tsx
'use client';

import { cn } from '@/lib/utils';
import { Beaker, BookOpen, Banknote, Users, User } from 'lucide-react';
import React from 'react';

const DiagramNode = ({
  icon,
  label,
  x,
  y,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  x: string;
  y: string;
  delay: number;
}) => (
  <g
    transform={`translate(${x}, ${y})`}
    className="transition-opacity duration-500"
    style={{ animation: `fadeIn ${500 + delay}ms ease-out forwards`, opacity: 0 }}
  >
    <circle
      cx="0"
      cy="0"
      r="40"
      fill="hsl(var(--background))"
      stroke="hsl(var(--primary))"
      strokeWidth="1.5"
    />
    <foreignObject x="-24" y="-24" width="48" height="48">
      <div className="flex items-center justify-center w-full h-full">
        {React.createElement(icon, { className: 'w-8 h-8 text-primary' })}
      </div>
    </foreignObject>
    <text
      y="55"
      textAnchor="middle"
      fill="hsl(var(--foreground))"
      className="font-semibold text-sm"
    >
      {label}
    </text>
  </g>
);

export const FederationDiagram = () => {
  return (
    <div className="w-full aspect-square max-w-xl mx-auto my-8">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0%, 100% {
              filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.7));
            }
            50% {
              filter: drop-shadow(0 0 12px hsl(var(--primary) / 0.9));
            }
          }
        `}
      </style>
      <svg viewBox="0 0 500 500" className="w-full h-full">
        <defs>
          <radialGradient id="divineAura" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="hsl(var(--primary) / 0)" />
            <stop offset="90%" stopColor="hsl(var(--primary) / 0.1)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
        </defs>

        {/* The Divine Presence */}
        <circle
          cx="250"
          cy="250"
          r="250"
          fill="url(#divineAura)"
          className="animate-[pulse_5s_ease-in-out_infinite]"
        />

        {/* Lines of Connection */}
        <g className="opacity-30">
          <line
            x1="250"
            y1="250"
            x2="100"
            y2="100"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1="250"
            y1="250"
            x2="400"
            y2="100"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1="250"
            y1="250"
            x2="400"
            y2="400"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1="250"
            y1="250"
            x2="100"
            y2="400"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4"
          />
        </g>

        {/* Central Node: The Individual Soul */}
        <g
          transform="translate(250, 250)"
          className="transition-opacity duration-500"
          style={{ animation: 'fadeIn 500ms ease-out forwards', opacity: 0 }}
        >
          <circle
            cx="0"
            cy="0"
            r="50"
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          <foreignObject x="-25" y="-25" width="50" height="50">
            <div className="flex items-center justify-center w-full h-full">
              <User className="w-10 h-10 text-primary" />
            </div>
          </foreignObject>
          <text
            y="68"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            className="font-bold text-base"
          >
            The Soul
          </text>
        </g>

        {/* Outer Nodes */}
        <DiagramNode
          icon={Beaker}
          label="Crucible"
          x="100"
          y="100"
          delay={200}
        />
        <DiagramNode
          icon={BookOpen}
          label="Nuncy Lingua"
          x="400"
          y="100"
          delay={400}
        />
        <DiagramNode
          icon={Banknote}
          label="Treasury"
          x="100"
          y="400"
          delay={600}
        />
        <DiagramNode
          icon={Users}
          label="Federation"
          x="400"
          y="400"
          delay={800}
        />
        
      </svg>
    </div>
  );
};
