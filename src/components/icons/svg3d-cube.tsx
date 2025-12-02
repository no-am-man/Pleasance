'use client';

import * as React from 'react';
import { SVGProps, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ColorPixel = {
  x: number;
  y: number;
  z: number;
  color: string;
};

type Svg3dCubeProps = SVGProps<SVGSVGElement> & {
  pixels: ColorPixel[];
};

export function Svg3dCube(props: Svg3dCubeProps) {
  const { className, pixels, ...rest } = props;
  const viewWidth = 400;
  const viewHeight = 400;

  const [rotationX, setRotationX] = useState(-0.5);
  const [rotationY, setRotationY] = useState(0.5);

  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;
    
    setRotationY(prevY => prevY + deltaX * 0.01);
    setRotationX(prevX => prevX - deltaY * 0.01);
    
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };
  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const projectedPixels = useMemo(() => {
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    return pixels
      .map(p => {
        // Rotate around Y axis
        let newX = p.x * cosY - p.z * sinY;
        let newZ = p.x * sinY + p.z * cosY;

        // Rotate around X axis
        let newY = p.y * cosX - newZ * sinX;
        newZ = p.y * sinX + newZ * cosX;
        
        // Simple perspective projection
        const perspective = 250 / (250 + newZ);
        const screenX = newX * perspective;
        const screenY = newY * perspective;

        return {
          ...p,
          screenX,
          screenY,
          depth: newZ,
          size: perspective * 2.5, // Make pixels smaller in the distance
        };
      })
      .sort((a, b) => a.depth - b.depth); // Sort by depth for correct layering
  }, [pixels, rotationX, rotationY]);

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn('w-full h-full', className, isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab')}
      {...rest}
    >
      <g style={{ transform: `translate(${viewWidth / 2}px, ${viewHeight / 2}px)` }}>
        {projectedPixels.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.screenX}
            cy={p.screenY}
            r={p.size}
            fill={p.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: i * 0.002, duration: 0.1 }}
          />
        ))}

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
