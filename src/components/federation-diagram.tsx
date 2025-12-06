// src/components/federation-diagram.tsx
'use client';

import { Sparkles, BookOpen, Banknote, Users, User, Warehouse, Info, Bot, Bug } from 'lucide-react';
import React from 'react';
import { KanbanIcon } from './icons/kanban-icon';

const DiagramNode = ({
  label,
  icon: Icon,
  x,
  y,
  delay,
  size = 40,
}: {
  label: string;
  icon: React.ElementType;
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
     <Icon className="text-primary" x="-12" y="-12" width="24" height="24" />
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

export const FederationDiagram = ({ t }: { t: (key: string) => string }) => {
  return (
    <div className="w-full mx-auto my-8 aspect-[6/5]">
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
      <svg viewBox="0 0 600 500" className="w-full h-full">
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
          cy="250"
          r="250"
          fill="url(#divineAura)"
          className="animate-[pulseAura_6s_ease-in-out_infinite]"
        />

        {/* Top Layer: Public Tools */}
        <DiagramNode label={t('diagramRoadmap')} icon={KanbanIcon} x="150" y="50" delay={200} size={35} />
        <DiagramNode label={t('diagramAmbasedor')} icon={Bot} x="300" y="50" delay={300} size={35} />
        <DiagramNode label={t('diagramBugTracker')} icon={Bug} x="450" y="50" delay={400} size={35} />
        

        {/* Central Node */}
        <DiagramNode label={t('diagramSovereignSoul')} icon={User} x="90" y="250" delay={0} size={50}/>
        
        {/* Mid Layer: Creation & Learning Tools */}
        <DiagramNode label={t('diagramNuncyLingua')} icon={BookOpen} x="300" y="160" delay={500} />
        <DiagramNode label={t('diagramAIWorkshop')} icon={Sparkles} x="480" y="160" delay={600} />
        
        {/* Mid Layer: Declaration */}
        <DiagramNode label={t('diagramTreasury')} icon={Banknote} x="390" y="280" delay={700} />

        {/* Bottom Layer: Action & Community */}
        <DiagramNode label={t('diagramWorkshopOfManifestation')} icon={Warehouse} x="300" y="400" delay={800} />
        <DiagramNode label={t('diagramFederation')} icon={Users} x="480" y="400" delay={900} />
        
        {/* Flow Arrows */}
        {/* Soul -> Creation/Learning */}
        <FlowArrow path="M 140 250 Q 210 190 290 190" delay={1200} />
        <FlowArrow path="M 140 250 Q 290 180 470 190" delay={1300} />
        
        {/* Creation -> Treasury */}
        <FlowArrow path="M 300 200 V 240" delay={1400} />
        <FlowArrow path="M 480 200 V 240" delay={1500} />

        {/* Treasury -> Action/Community */}
        <FlowArrow path="M 380 320 Q 330 350 305 365" delay={1600} />
        <FlowArrow path="M 400 320 Q 450 350 475 365" delay={1700} />
        
        {/* Community/Action -> Soul (inspiration) */}
        <FlowArrow path="M 440 400 C 300 480, 200 380, 140 275" delay={1800} />
        
      </svg>
    </div>
  );
};
