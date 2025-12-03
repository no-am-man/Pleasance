
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
      delay: i * 0.2 + 0.5,
      duration: 1.0,
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

const Path = ({ d, custom }: { d: string, custom: number }) => (
    <motion.path
        d={d}
        stroke="url(#grad1)" strokeWidth="1.5" fill="none"
        markerEnd="url(#arrow)"
        variants={pathVariants} custom={custom}
    />
);

const nodes = [
    { icon: <Users className="w-6 h-6" />, label: 'Community', angle: -90, custom: 1 },
    { icon: <BookOpen className="w-6 h-6" />, label: 'Texts', angle: -45, custom: 2 },
    { icon: <Beaker className="w-6 h-6" />, label: 'Altar', angle: 0, custom: 3 },
    { icon: <Banknote className="w-6 h-6" />, label: 'Treasury', angle: 45, custom: 4 },
    { icon: <Warehouse className="w-6 h-6" />, label: 'Fabrication', angle: 90, custom: 5 },
];

const metaNodes = [
    { icon: <KanbanIcon className="w-6 h-6" />, label: 'Roadmap', angle: 180, custom: 6 },
    { icon: <Bug className="w-6 h-6" />, label: 'Bugs', angle: 225, custom: 7 },
    { icon: <Bot className="w-6 h-6" />, label: 'Conductor', angle: -135, custom: 8 },
];

export function FederationDiagram() {
    const radius = 150;
    const center = 200;

    const getNodePos = (angle: number) => ({
        x: center + radius * Math.cos(angle * Math.PI / 180),
        y: center + radius * Math.sin(angle * Math.PI / 180),
    });

    const getControlPoints = (startPos: {x: number, y: number}, endPos: {x: number, y: number}) => {
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;

        // Add curvature by offsetting control points perpendicular to the line between start and end
        const curveFactor = 0.2;
        const ctrl1X = midX - dy * curveFactor;
        const ctrl1Y = midY + dx * curveFactor;
        const ctrl2X = midX - dy * curveFactor;
        const ctrl2Y = midY + dx * curveFactor;
        
        return `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y}`;
    }


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
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="4" markerHeight="4"
                        orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
                    </marker>
                </defs>
                
                {/* Paths with Arrows */}
                {nodes.map((node, i) => {
                    const nextNode = nodes[(i + 1) % nodes.length];
                    const startPos = getNodePos(node.angle);
                    const endPos = getNodePos(nextNode.angle);
                    const controlPoints = getControlPoints(startPos, endPos);

                    const d = `M ${startPos.x},${startPos.y} ${controlPoints} ${endPos.x},${endPos.y}`;
                    
                    // Don't draw arrow from last node back to first
                    if (i < nodes.length - 1) {
                      return <Path key={`path-${i}`} d={d} custom={node.custom} />;
                    }
                    return null;
                })}

                {/* Dashed lines for meta nodes */}
                 {metaNodes.map(node => {
                    const pos = getNodePos(node.angle);
                    return (
                        <motion.path
                            key={`meta-path-${node.label}`}
                            d={`M ${center},${center} L ${pos.x},${pos.y}`}
                            stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
                            variants={pathVariants} custom={node.custom}
                        />
                    );
                 })}


                {/* Nodes */}
                {nodes.map(node => {
                    const pos = getNodePos(node.angle);
                    return <Node key={node.label} icon={node.icon} label={node.label} x={pos.x} y={pos.y} custom={node.custom} />;
                })}
                {metaNodes.map(node => {
                    const pos = getNodePos(node.angle);
                    return <Node key={node.label} icon={node.icon} label={node.label} x={pos.x} y={pos.y} custom={node.custom} />;
                })}
                
                {/* Central Node */}
                <motion.g filter="url(#glow)">
                    <Node icon={<Logo className="w-8 h-8" />} label="Source" x={center} y={center} custom={0} />
                </motion.g>

            </svg>
        </div>
    );
}
