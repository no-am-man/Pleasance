
// src/components/federation-diagram.tsx
'use client';

import { Beaker, BookOpen, Banknote, Users, User, Warehouse, Info, Bot, Bug } from 'lucide-react';
import React from 'react';
import { KanbanIcon } from './icons/kanban-icon';

const DiagramNode = ({
  label,
  x,
  y,
  delay,
  size = 40,
}: {
  label: string;
  x: string;
  y: string;
  delay: number;
  size?: number;
}) => (
  <g
    transform={`translate(${x}, ${y})`}
    className="transition-opacity duration-500"
    style={{ animation: `fadeIn ${500 + delay}ms ease-out forwards`, opacity: 0 }}
  >
    <circle
      cx="0"
      cy="0"
      r={size}
      fill="hsl(var(--background))"
      stroke="hsl(var(--primary))"
      strokeWidth="1.5"
    />
    <text
      y={size + 20}
      textAnchor="middle"
      fill="hsl(var(--foreground))"
      className="font-semibold text-sm"
    >
      {label}
    </text>
  </g>
);

const FlowArrow = ({ path, delay }: { path: string; delay: number }) => (
  <path
    d={path}
    stroke="hsl(var(--primary) / 0.6)"
    strokeWidth="1.5"
    fill="none"
    strokeDasharray="4, 4"
    markerEnd="url(#arrowhead)"
    style={{ animation: `fadeIn ${500 + delay}ms ease-out forwards`, opacity: 0 }}
  />
);

export const FederationDiagram = () => {
  return (
    <div className="w-full max-w-lg mx-auto my-8">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulseAura {
            0%, 100% {
              filter: drop-shadow(0 0 5px hsl(var(--primary) / 0.5));
            }
            50% {
              filter: drop-shadow(0 0 15px hsl(var(--primary) / 0.7));
            }
          }
        `}
      </style>
      <svg viewBox="0 0 500 450" className="w-full h-full">
        <defs>
          <radialGradient id="divineAura" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="hsl(var(--primary) / 0)" />
            <stop offset="90%" stopColor="hsl(var(--primary) / 0.1)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary) / 0.6)" />
          </marker>
        </defs>

        {/* The Aura */}
        <circle
          cx="250"
          cy="225"
          r="225"
          fill="url(#divineAura)"
          className="animate-[pulseAura_6s_ease-in-out_infinite]"
        />

        {/* Nodes */}
        <DiagramNode label="The Sovereign Soul" x="90" y="225" delay={0} />
        
        {/* Top Layer: Creation & Learning Tools */}
        <DiagramNode label="Nuncy Lingua" x="250" y="90" delay={200} />
        <DiagramNode label="Lab" x="410" y="90" delay={400} />
        
        {/* Mid Layer: Declaration */}
        <DiagramNode label="Treasury" x="330" y="225" delay={600} />

        {/* Bottom Layer: Action & Community */}
        <DiagramNode label="Workshop of Manifestation" x="250" y="360" delay={800} />
        <DiagramNode label="Federation" x="410" y="360" delay={1000} />
        
        {/* Flow Arrows */}
        {/* Soul -> Creation */}
        <FlowArrow path="M 130 225 Q 180 150 240 125" delay={1200} />
        <FlowArrow path="M 130 225 Q 260 150 400 125" delay={1300} />
        
        {/* Creation -> Treasury */}
        <FlowArrow path="M 250 130 V 185" delay={1400} />
        <FlowArrow path="M 410 130 V 185" delay={1500} />

        {/* Treasury -> Action/Community */}
        <FlowArrow path="M 320 265 Q 280 300 255 325" delay={1600} />
        <FlowArrow path="M 340 265 Q 380 300 405 325" delay={1700} />
        
        {/* Community -> Soul (inspiration) */}
        <FlowArrow path="M 370 360 C 250 420, 200 350, 130 250" delay={1800} />
        
      </svg>
    </div>
  );
};
