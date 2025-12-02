'use client';

import { motion } from 'framer-motion';
import { Users, User, Shield, Bot, Package, BookOpen, Banknote } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  }),
};

const lineVariants = {
    hidden: { pathLength: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      transition: {
        delay: i * 0.1 + 0.5,
        duration: 0.5,
        ease: "easeInOut",
      },
    }),
  };

const Node = ({ icon, label, x, y, custom, color = "text-primary" }: { icon: React.ReactNode, label: string, x: number, y: number, custom: number, color?: string }) => (
    <motion.g initial="hidden" animate="visible" variants={itemVariants} custom={custom}>
        <foreignObject x={x - 40} y={y - 40} width="80" height="80">
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <div className={`p-3 rounded-full bg-card border-2 border-border ${color}`}>
                    {icon}
                </div>
                <p className="text-xs font-semibold text-foreground mt-1">{label}</p>
            </div>
        </foreignObject>
    </motion.g>
);

const Line = ({ x1, y1, x2, y2, custom }: { x1: number, y1: number, x2: number, y2: number, custom: number }) => (
    <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
        variants={lineVariants}
        initial="hidden"
        animate="visible"
        custom={custom}
    />
);


export function FederationDiagram() {
  return (
    <div className="my-16 w-full flex justify-center">
        <svg viewBox="0 0 400 300" className="w-full max-w-2xl h-auto">
            <defs>
                <motion.path
                    id="curve1"
                    d="M 120 70 Q 150 110, 200 120"
                    fill="transparent"
                />
                 <motion.path
                    id="curve2"
                    d="M 280 70 Q 250 110, 200 120"
                    fill="transparent"
                />
            </defs>

            {/* Lines */}
            <Line x1={200} y1={50} x2={200} y2={120} custom={1} />
            <Line x1={80} y1={230} x2={200} y2={120} custom={2} />
            <Line x1={320} y1={230} x2={200} y2={120} custom={3} />

            {/* Nodes */}
            <Node icon={<Shield className="w-6 h-6" />} label="Federation" x={200} y={50} custom={0} color="text-yellow-400" />
            
            <Node icon={<Users className="w-6 h-6" />} label="Communities" x={200} y={150} custom={1} />

            <Node icon={<User className="w-6 h-6" />} label="Individuals" x={80} y={230} custom={2} />
            <Node icon={<Bot className="w-6 h-6" />} label="AI Agents" x={140} y={230} custom={3} />
            
            <g transform="translate(140, 0)">
                <Node icon={<BookOpen className="w-5 h-5" />} label="Nuncy Lingua" x={180} y={200} custom={4} />
                <Node icon={<Package className="w-5 h-5" />} label="Fabrication" x={220} y M="250" custom={5} />
                <Node icon={<Banknote className="w-5 h-5" />} label="Treasury" x={260} y="200" custom={6} />
                <text x={220} y={170} textAnchor="middle" className="text-xs font-semibold fill-muted-foreground">Tools</text>

                {/* Lines to Tools */}
                <Line x1={200} y1={150} x2={180} y2={190} custom={4.5} />
                <Line x1={200} y1={150} x2={220} y2={190} custom={5.5} />
                <Line x1={200} y1={150} x2={260} y2={190} custom={6.5} />
            </g>

             {/* Text Labels */}
            <text x="110" y="150" className="text-[10px] fill-muted-foreground" transform="rotate(-35, 110, 150)">forms</text>
            <text x="270" y="160" className="text-[10px] fill-muted-foreground" transform="rotate(25, 270, 160)">owns</text>
            <text x="200" y="95" textAnchor="middle" className="text-[10px] fill-muted-foreground">is composed of</text>
        </svg>
    </div>
  );
}