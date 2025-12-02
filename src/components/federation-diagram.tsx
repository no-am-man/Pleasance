
'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Warehouse, Banknote, Globe } from 'lucide-react';

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

const Node = ({ icon, label, x, y, custom, color = "text-primary", description }: { icon: React.ReactNode, label: string, x: number, y: number, custom: number, color?: string, description: string }) => (
    <motion.g initial="hidden" animate="visible" variants={itemVariants} custom={custom}>
        <foreignObject x={x - 60} y={y - 65} width="120" height="130">
            <div className="flex flex-col items-center justify-center text-center w-full h-full p-1">
                <div className={`p-3 rounded-full bg-card border-2 border-border ${color}`}>
                    {icon}
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </foreignObject>
    </motion.g>
);


export function FederationDiagram() {
  return (
    <div className="my-16 w-full flex justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-lg h-auto">
            <defs>
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-border" />
                </marker>
            </defs>

            {/* Paths */}
            <motion.path
                d="M 200, 100 Q 270, 125 315, 150"
                stroke="hsl(var(--border))" strokeWidth="1.5" fill="none"
                variants={pathVariants} custom={1} markerEnd="url(#arrowhead)" />
            <motion.path
                d="M 310, 200 Q 270, 240 230, 295"
                stroke="hsl(var(--border))" strokeWidth="1.5" fill="none"
                variants={pathVariants} custom={1.5} markerEnd="url(#arrowhead)" />
            <motion.path
                d="M 170, 295 Q 130, 240 90, 200"
                stroke="hsl(var(--border))" strokeWidth="1.5" fill="none"
                variants={pathVariants} custom={2} markerEnd="url(#arrowhead)" />
             <motion.path
                d="M 85, 150 Q 130, 125 200, 100"
                stroke="hsl(var(--border))" strokeWidth="1.5" fill="none"
                variants={pathVariants} custom={2.5} markerEnd="url(#arrowhead)" />


            {/* Nodes */}
            <Node icon={<Users className="w-6 h-6" />} label="Community" description="Join & form groups" x={200} y={60} custom={0} />
            <Node icon={<BookOpen className="w-6 h-6" />} label="Nuncy Lingua" description="Learn languages" x={340} y={175} custom={1} />
            <Node icon={<Warehouse className="w-6 h-6" />} label="Fabrication" description="Create products" x={60} y={175} custom={3} />
            <Node icon={<Banknote className="w-6 h-6" />} label="Treasury" description="Build wealth" x={200} y={340} custom={4} />

            {/* Special node for Global Markets */}
             <motion.g initial="hidden" animate="visible" variants={itemVariants} custom={2}>
                <foreignObject x={280} y={240} width="120" height="130">
                    <div className="flex flex-col items-center justify-center text-center w-full h-full p-1">
                        <div className="p-3 rounded-full bg-card border-2 border-yellow-400/50 text-yellow-400">
                           <Globe className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-2">Global Markets</p>
                         <p className="text-xs text-muted-foreground mt-1">Access new opportunities</p>
                    </div>
                </foreignObject>
            </motion.g>

            {/* Arrow from Lingua to Markets */}
             <motion.path
                d="M 340, 225 Q 330, 235 320, 245"
                stroke="hsl(var(--yellow-400))"
                strokeWidth="2"
                fill="none"
                variants={pathVariants}
                custom={3}
                markerEnd="url(#arrowhead)"
            />
        </svg>
    </div>
  );
}
