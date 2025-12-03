// src/components/federation-diagram.tsx
'use client';

import { Beaker, BookOpen, Banknote, Users, User, ArrowRight } from 'lucide-react';
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

const FlowArrow = ({ path, delay }: { path: string; delay: number }) => (
  <path
    d={path}
    stroke="hsl(var(--primary) / 0.6)"
    strokeWidth="2"
    fill="none"
    strokeDasharray="5, 5"
    markerEnd="url(#arrowhead)"
    style={{ animation: `fadeIn ${500 + delay}ms ease-out forwards`, opacity: 0 }}
  />
);

export const FederationDiagram = () => {
  return (
    <div className="w-full aspect-square">
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
      <svg viewBox="0 0 500 500" className="w-full h-full">
        <defs>
          <radialGradient id="divineAura" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="hsl(var(--primary) / 0)" />
            <stop offset="90%" stopColor="hsl(var(--primary) / 0.1)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary) / 0.6)" />
          </marker>
        </defs>

        {/* The Divine Aura */}
        <circle
          cx="250"
          cy="250"
          r="250"
          fill="url(#divineAura)"
          className="animate-[pulseAura_6s_ease-in-out_infinite]"
        />

        {/* Nodes */}
        <DiagramNode icon={User} label="The Soul" x="80" y="250" delay={0} />
        <DiagramNode icon={BookOpen} label="Nuncy Lingua" x="250" y="80" delay={200} />
        <DiagramNode icon={Beaker} label="Crucible" x="420" y="80" delay={400} />
        <DiagramNode icon={Banknote} label="Treasury" x="420" y="420" delay={600} />
        <DiagramNode icon={Users} label="Federation" x="80" y="420" delay={800} />
        
        {/* Flow Arrows */}
        <FlowArrow path="M 120 250 Q 180 150 240 120" delay={1000} />
        <FlowArrow path="M 120 250 Q 250 160 380 120" delay={1200} />
        <FlowArrow path="M 280 80 Q 340 120 380 120" delay={1400} />
        <FlowArrow path="M 420 120 V 380" delay={1600} />
        <FlowArrow path="M 380 420 H 120" delay={1800} />
        <FlowArrow path="M 80 380 V 290" delay={2000} />
        
        {/* Return to inspiration (implicit, suggested by the circle) */}
      </svg>
    </div>
  );
};
