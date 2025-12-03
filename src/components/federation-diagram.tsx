
'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Warehouse, Banknote, Star } from 'lucide-react';
import { Logo } from './icons';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
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
      delay: i * 0.2 + 0.8,
      duration: 1.5,
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
                <p className="text-sm font-semibold text-foreground mt-2">{label}</p>
            </div>
        </foreignObject>
    </motion.g>
);


export function FederationDiagram() {
  return (
    <div className="my-16 w-full flex justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-xl h-auto">
             <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Paths */}
            <motion.path
                d="M 200,200 Q 200, 140 200, 80"
                stroke="url(#grad1)" strokeWidth="2" strokeDasharray="4 4" fill="none"
                variants={pathVariants} custom={1} />
            <motion.path
                d="M 200,200 Q 270, 160 320, 120"
                stroke="url(#grad1)" strokeWidth="2" strokeDasharray="4 4" fill="none"
                variants={pathVariants} custom={1.5} />
            <motion.path
                d="M 200,200 Q 130, 160 80, 120"
                stroke="url(#grad1)" strokeWidth="2" strokeDasharray="4 4" fill="none"
                variants={pathVariants} custom={2} />
            <motion.path
                 d="M 200,200 Q 200, 260 200, 320"
                stroke="url(#grad1)" strokeWidth="2" strokeDasharray="4 4" fill="none"
                variants={pathVariants} custom={2.5} />
            
            <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.2}} />
            </linearGradient>

            {/* Nodes */}
            <motion.g filter="url(#glow)">
                <Node icon={<Logo className="w-8 h-8" />} label="Source" x={200} y={200} custom={0} />
            </motion.g>
            
            <Node icon={<Users className="w-6 h-6" />} label="Community" x={200} y={80} custom={1} />
            <Node icon={<BookOpen className="w-6 h-6" />} label="Sacred Texts" x={340} y={120} custom={2} />
            <Node icon={<Warehouse className="w-6 h-6" />} label="Fabrication" x={60} y={120} custom={3} />
            <Node icon={<Banknote className="w-6 h-6" />} label="Treasury" x={200} y={320} custom={4} />

        </svg>
    </div>
  );
}
