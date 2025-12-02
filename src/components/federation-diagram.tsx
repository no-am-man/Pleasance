
'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Warehouse, Banknote, Globe, ArrowRight } from 'lucide-react';

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
        <foreignObject x={x - 60} y={y - 45} width="120" height="90">
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
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
        <svg viewBox="0 0 400 400" className="w-full max-w-3xl h-auto">
            <defs>
                 <motion.path
                    id="flowPath"
                    d="M 200, 80 A 120,120 0 1,1 199,80"
                    fill="none"
                 />
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--border))" />
                </marker>
            </defs>

            {/* The circular path */}
            <motion.path
                d="M 200, 80 A 120,120 0 1,1 199.9,80"
                stroke="hsl(var(--border))"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
                variants={pathVariants}
                initial="hidden"
                animate="visible"
                custom={1}
                markerEnd="url(#arrowhead)"
                markerMid="url(#arrowhead)"
            />

            {/* Nodes */}
            <Node icon={<Users className="w-6 h-6" />} label="Community" description="Join & form groups" x={200} y={50} custom={0} />
            <Node icon={<BookOpen className="w-6 h-6" />} label="Nuncy Lingua" description="Learn languages" x={340} y={150} custom={1} color="text-yellow-400" />
            <Node icon={<Warehouse className="w-6 h-6" />} label="Fabrication" description="Create products" x={60} y={150} custom={3} />
            <Node icon={<Banknote className="w-6 h-6" />} label="Treasury" description="Build wealth" x={200} y={350} custom={4} />
            
            {/* International Markets Node */}
             <motion.g initial="hidden" animate="visible" variants={itemVariants} custom={2}>
                <foreignObject x={290} y={260} width="120" height="90">
                    <div className="flex flex-col items-center justify-center text-center w-full h-full">
                        <div className="p-3 rounded-full bg-card border-2 border-yellow-400/50 text-yellow-400">
                           <Globe className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-2">Global Markets</p>
                         <p className="text-xs text-muted-foreground mt-1">Access new opportunities</p>
                    </div>
                </foreignObject>
            </motion.g>

            {/* Arrow from Lingua to Markets */}
             <motion.line
                x1="320" y1="190"
                x2="310" y2="250"
                stroke="hsl(var(--yellow-400))"
                strokeWidth="2"
                variants={pathVariants}
                custom={2.5}
                markerEnd="url(#arrowhead)"
            />
            
        </svg>
    </div>
  );
}
