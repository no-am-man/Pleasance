'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

// 3D Point
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// 2D Point
interface Point2D {
  x: number;
  y: number;
}

// Perspective projection function
function project(point: Point3D, perspective: number): Point2D {
  const scale = perspective / (perspective + point.z);
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

const pyramidVariants = {
    initial: {
        opacity: 0,
        pathLength: 0,
    },
    animate: (i: number) => ({
        opacity: [0, 0.7, 0.7, 0],
        pathLength: [0, 1, 1, 1],
        transition: {
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
        }
    })
};

export function Svg3dCube() {
  const size = 50;
  const perspective = 200;
  const viewWidth = 400;
  const viewHeight = 400;

  const vertices: Point3D[] = [
    { x: -size, y: -size, z: -size }, // 0: Left-Back-Top
    { x: size, y: -size, z: -size },  // 1: Right-Back-Top
    { x: size, y: size, z: -size },   // 2: Right-Back-Bottom
    { x: -size, y: size, z: -size },  // 3: Left-Back-Bottom
    { x: -size, y: -size, z: size },  // 4: Left-Front-Top
    { x: size, y: -size, z: size },   // 5: Right-Front-Top
    { x: size, y: size, z: size },    // 6: Right-Front-Bottom
    { x: -size, y: size, z: size },   // 7: Left-Front-Bottom
  ];

  const projectedPoints = vertices.map(v => project(v, perspective));

  const center: Point2D = { x: viewWidth / 2, y: viewHeight / 2 };

  const faces = [
    [0, 1, 2, 3], // Back
    [4, 5, 6, 7], // Front
    [0, 4, 7, 3], // Left
    [1, 5, 6, 2], // Right
    [0, 1, 5, 4], // Top
    [3, 2, 6, 7], // Bottom
  ];

  const pyramidVectors = [
    { x: 1, y: -1, z: 1 },  // Right-Front-Up
    { x: 1, y: 1, z: 1 },   // Right-Front-Down
    { x: 1, y: -1, z: -1 }, // Right-Back-Up
    { x: 1, y: 1, z: -1 },  // Right-Back-Down
    { x: -1, y: -1, z: 1 }, // Left-Front-Up
    { x: -1, y: 1, z: 1 },  // Left-Front-Down
    { x: -1, y: -1, z: -1 },// Left-Back-Up
    { x: -1, y: 1, z: -1 }, // Left-Back-Down
  ];
  
  const pyramidApexes = pyramidVectors.map(vec => ({
    x: vec.x * 1000,
    y: vec.y * 1000,
    z: vec.z * 1000,
  }));
  
  const projectedApexes = pyramidApexes.map(p => project(p, perspective));

  return (
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} width="100%" height="100%">
      <g transform={`translate(${center.x}, ${center.y})`}>
        {/* Render Cube Faces */}
        {faces.map((face, i) => (
          <polygon
            key={i}
            points={face.map(p => `${projectedPoints[p].x},${projectedPoints[p].y}`).join(' ')}
            fill="hsl(var(--primary) / 0.1)"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
          />
        ))}

        {/* Render Pyramid Lines */}
        {projectedApexes.map((apex, i) => (
            <g key={`pyramid-${i}`}>
                <motion.line
                    x1={0} y1={0}
                    x2={apex.x} y2={apex.y}
                    stroke="hsl(var(--accent-foreground))"
                    strokeWidth="1"
                    variants={pyramidVariants}
                    initial="initial"
                    animate="animate"
                    custom={i}
                />
            </g>
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
