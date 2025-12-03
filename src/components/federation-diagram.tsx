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
      <svg viewBox="0 0 600 450" className="w-full h-full">
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
          cx="300"
          cy="225"
          r="225"
          fill="url(#divineAura)"
          className="animate-[pulseAura_6s_ease-in-out_infinite]"
        />

        {/* Nodes */}
        <DiagramNode label="The Sovereign Soul" x="90" y="225" delay={0} />
        
        {/* Top Layer: Creation & Learning Tools */}
        <DiagramNode label="Nuncy Lingua" x="240" y="90" delay={200} />
        <DiagramNode label="Crucible of Creation" x="360" y="90" delay={400} />
        
        {/* Mid Layer: Declaration */}
        <DiagramNode label="Treasury" x="300" y="225" delay={600} />

        {/* Bottom Layer: Action & Community */}
        <DiagramNode label="Manifestation" x="240" y="360" delay={800} />
        <DiagramNode label="Federation" x="360" y="360" delay={1000} />
        
        {/* Right-Side Layer: Guiding Systems */}
        <g transform="translate(520, 225)">
            <DiagramNode label="Wiki" x="0" y="-120" delay={1200} size={30} />
            <DiagramNode label="Roadmap" x="0" y="-40" delay={1400} size={30} />
            <DiagramNode label="Conductor" x="0" y="40" delay={1600} size={30} />
            <DiagramNode label="Bug Tracker" x="0" y="120" delay={1800} size={30} />
        </g>
        
        {/* Flow Arrows */}
        {/* Soul -> Creation */}
        <FlowArrow path="M 130 225 Q 180 150 230 125" delay={2000} />
        <FlowArrow path="M 130 225 Q 240 160 350 125" delay={2100} />
        
        {/* Creation -> Treasury */}
        <FlowArrow path="M 240 130 V 185" delay={2200} />
        <FlowArrow path="M 360 130 V 185" delay={2300} />

        {/* Treasury -> Action/Community */}
        <FlowArrow path="M 290 265 Q 260 300 245 325" delay={2400} />
        <FlowArrow path="M 310 265 Q 340 300 355 325" delay={2500} />
        
        {/* Community -> Soul (inspiration) */}
        <FlowArrow path="M 320 360 C 200 420, 150 350, 130 250" delay={2600} />
        
        {/* Guiding Systems -> All */}
        <FlowArrow path="M 480 105 H 400" delay={2700} />
        <FlowArrow path="M 480 185 H 340" delay={2800} />
        <FlowArrow path="M 480 265 H 400" delay={2900} />
        <FlowArrow path="M 480 345 H 400" delay={3000} />
      </svg>
    </div>
  );
};