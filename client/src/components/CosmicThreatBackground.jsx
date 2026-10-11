import React from 'react';

/**
 * CosmicThreatBackground
 * Recreates the exact celestial red cybernetic background from Image 1:
 * - Deep obsidian void
 * - Starfield of faint red floating particles
 * - High-energy red laser beams cutting across from left to right
 * - Orbital dark node sphere with glowing red plasma torus / ring
 */
export default function CosmicThreatBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Deep dark gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 45%, #100609 0%, #080A10 45%, #05070B 100%)',
        }}
      />

      {/* SVG Canvas for Lasers, Particles & Orbital Node */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Laser Gradients */}
          <linearGradient id="laserGrad1" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#F01616" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#800A0A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F01616" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="laserGrad2" x1="0%" y1="100%" x2="100%" y2="30%">
            <stop offset="0%" stopColor="#F01616" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#900C0C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F01616" stopOpacity="0.0" />
          </linearGradient>

          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F01616" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#F01616" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter id="bloomRed" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Diagonal high-energy laser streaks traversing to the orbital node */}
        <path
          d="M -50 200 Q 400 380 950 420"
          stroke="url(#laserGrad1)"
          strokeWidth="3.5"
          fill="none"
          filter="url(#bloomRed)"
          opacity="0.85"
        />
        <path
          d="M -50 580 Q 450 480 960 410"
          stroke="url(#laserGrad2)"
          strokeWidth="3.5"
          fill="none"
          filter="url(#bloomRed)"
          opacity="0.75"
        />
        <path
          d="M 980 400 L 1300 220"
          stroke="#F01616"
          strokeWidth="3"
          strokeOpacity="0.5"
          fill="none"
          filter="url(#bloomRed)"
        />

        {/* Ambient Red Glow Sphere behind Intercept Core */}
        <circle cx="82%" cy="44%" r="200" fill="url(#nodeGlow)" />

        {/* Dark Orbital Sphere Core */}
        <circle cx="82%" cy="44%" r="130" fill="#080709" stroke="#1F0E12" strokeWidth="1" />

        {/* Glowing Red Torus / Elliptical Ring orbiting the core */}
        <ellipse
          cx="82%"
          cy="43%"
          rx="170"
          ry="32"
          fill="none"
          stroke="#F01616"
          strokeWidth="7"
          filter="url(#bloomRed)"
          transform="rotate(-4 1100 400)"
          strokeDasharray="950 150"
          opacity="0.95"
        />

        {/* Bright Glowing Core Block inside the sphere */}
        <rect
          x="80%"
          y="40.5%"
          width="42"
          height="42"
          rx="6"
          fill="#FF2626"
          filter="url(#bloomRed)"
          transform="rotate(-5 1100 400)"
          style={{
            filter: 'drop-shadow(0 0 20px #F01616) drop-shadow(0 0 40px #F01616)',
          }}
        />

        {/* Floating red dust/stars */}
        {[
          { cx: '12%', cy: '12%', r: 1.2 },
          { cx: '34%', cy: '11%', r: 1 },
          { cx: '80%', cy: '8%', r: 1.5 },
          { cx: '95%', cy: '22%', r: 1.2 },
          { cx: '8%', cy: '34%', r: 1.4 },
          { cx: '35%', cy: '20%', r: 1.1 },
          { cx: '46%', cy: '22%', r: 1 },
          { cx: '26%', cy: '32%', r: 1.3 },
          { cx: '9%', cy: '47%', r: 1.5 },
          { cx: '18%', cy: '74%', r: 1.2 },
          { cx: '33%', cy: '81%', r: 1 },
          { cx: '74%', cy: '64%', r: 1.5 },
          { cx: '86%', cy: '86%', r: 1.2 },
          { cx: '62%', cy: '81%', r: 1.1 },
          { cx: '80%', cy: '56%', r: 1.4 },
        ].map((pt, i) => (
          <circle
            key={i}
            cx={pt.cx}
            cy={pt.cy}
            r={pt.r}
            fill="#FF3333"
            opacity={0.4 + (i % 5) * 0.12}
            filter="url(#bloomRed)"
          />
        ))}
      </svg>
    </div>
  );
}
