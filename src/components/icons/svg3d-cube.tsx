
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { SVGProps, useState } from 'react';
import { cn } from '@/lib/utils';


export function Svg3dCube(props: SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  const viewWidth = 400;
  const viewHeight = 400;

  const [rotation, setRotation] = useState({ x: -0.5, y: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;

    setRotation({
      y: rotation.y + deltaX * 0.01,
      x: rotation.x - deltaY * 0.01,
    });

    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };


  return (
    <svg 
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(className, isDragging ? 'cursor-grabbing' : 'cursor-grab')}
        {...rest}>
      <g style={{ transform: `translateX(${viewWidth/2}px) translateY(${viewHeight/2}px) rotateX(${rotation.x}rad) rotateY(${rotation.y}rad)` }}>
         {/* The AI-generated SVG content will be rendered here by the parent component */}
         {/* This component now only provides the interactive rotation wrapper. */}

        {/* Heart */}
         <motion.circle 
            cx="0" 
            cy="0" 
            r="3" 
            fill="hsl(var(--primary))"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </g>
    </svg>
  );
}
