
'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Warehouse, Banknote, Beaker, Bug, Bot } from 'lucide-react';
import { Logo } from './icons';
import { KanbanIcon } from './icons/kanban-icon';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  }),
};

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: i * 0.15 + 0.8,
      duration: 1.2,
      ease: 'easeInOut',
    },
  }),
};

const Node = ({ icon, label, x, y, custom, color = "text-primary" }: { icon: React.ReactNode, label: string, x: number, y: number, custom: number, color?: string }) => (
    <motion.g initial="hidden" animate="visible" variants={itemVariants} custom={custom}>
        <foreignObject x={x - 40} y={y - 40} width="80" height="80">
            <div className="flex flex-col items-center justify-center text-center w-full h-full p-1">
                <div className={`p-3 rounded-full bg-card border-2 border-border ${color}`}>
                    {icon}
                </div>
                <p className="text-xs font-semibold text-foreground mt-1">{label}</p>
            </div>
        </foreignObject>
    </motion.g>
);

const Path = ({ x, y, custom }: { x: number, y: number, custom: number }) => (
    <motion.path
        d={`M 200,200 L ${x},${y}`}
        stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
        variants={pathVariants} custom={custom}
    />
);

const nodes = [
    { icon: <Users className="w-6 h-6" />, label: 'Community', angle: -90, custom: 1 },
    { icon: <Beaker className="w-6 h-6" />, label: 'Altar', angle: -45, custom: 2 },
    { icon: <KanbanIcon className="w-6 h-6" />, label: 'Roadmap', angle: 0, custom: 3 },
    { icon: <Bug className="w-6 h-6" />, label: 'Bugs', angle: 45, custom: 4 },
    { icon: <BookOpen className="w-6 h-6" />, label: 'Texts', angle: 90, custom: 5 },
    { icon: <Warehouse className="w-6 h-6" />, label: 'Fabrication', angle: 135, custom: 6 },
    { icon: <Banknote className="w-6 h-6" />, label: 'Treasury', angle: 180, custom: 7 },
    { icon: <Bot className="w-6 h-6" />, label: 'Conductor', angle: -135, custom: 8 },
];

export function FederationDiagram() {
    const radius = 150;
    const center = 200;

    return (
        <div className="my-16 w-full flex justify-center">
            <svg viewBox="0 0 400 400" className="w-full max-w-xl h-auto">
                 <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.8}} />
                        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 0.3}} />
                    </linearGradient>
                </defs>
                
                {/* Paths */}
                {nodes.map(node => {
                    const x = center + radius * Math.cos(node.angle * Math.PI / 180);
                    const y = center + radius * Math.sin(node.angle * Math.PI / 180);
                    return <Path key={node.label} x={x} y={y} custom={node.custom} />;
                })}

                {/* Nodes */}
                {nodes.map(node => {
                    const x = center + radius * Math.cos(node.angle * Math.PI / 180);
                    const y = center + radius * Math.sin(node.angle * Math.PI / 180);
                    return <Node key={node.label} icon={node.icon} label={node.label} x={x} y={y} custom={node.custom} />;
                })}
                
                {/* Central Node */}
                <motion.g filter="url(#glow)">
                    <Node icon={<Logo className="w-8 h-8" />} label="Source" x={center} y={center} custom={0} />
                </motion.g>

            </svg>
        </div>
    );
}
