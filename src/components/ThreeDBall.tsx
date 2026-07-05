import React, { useId } from 'react';

interface ThreeDBallProps {
  className?: string;
  onClick?: () => void;
}

export const ThreeDBall: React.FC<ThreeDBallProps> = ({ className = "w-12 h-12", onClick }) => {
  const uniqueId = useId().replace(/:/g, "");
  const sphereGradId = `sphereGrad-${uniqueId}`;
  const shadowOverlayId = `shadowOverlay-${uniqueId}`;

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)] select-none cursor-pointer`}
      onClick={onClick}
    >
      <defs>
        {/* Radial gradient for 3D sphere look - premium gold championship theme */}
        <radialGradient id={sphereGradId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fffdf0"/>
          <stop offset="40%" stopColor="#fbbf24"/>
          <stop offset="80%" stopColor="#ca8a04"/>
          <stop offset="100%" stopColor="#451a03"/>
        </radialGradient>
        {/* Shading overlay */}
        <radialGradient id={shadowOverlayId} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#000000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      
      {/* Outer circle with sphere gradient */}
      <circle cx="50" cy="50" r="48" fill={`url(#${sphereGradId})`} stroke="#451a03" strokeWidth="1.5"/>
      
      {/* Central pentagon - rich midnight royal blue */}
      <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#1e1b4b"/>
      
      {/* Lines connecting center pentagon to outer panels */}
      <line x1="50" y1="38" x2="50" y2="24" stroke="#451a03" strokeWidth="2"/>
      <line x1="60" y1="45" x2="72" y2="41" stroke="#451a03" strokeWidth="2"/>
      <line x1="56" y1="57" x2="64" y2="69" stroke="#451a03" strokeWidth="2"/>
      <line x1="44" y1="57" x2="36" y2="69" stroke="#451a03" strokeWidth="2"/>
      <line x1="40" y1="45" x2="28" y2="41" stroke="#451a03" strokeWidth="2"/>
      
      {/* Outer hexagons/pentagons lines */}
      <polygon points="50,24 38,15 28,24 28,41 40,45" fill="none" stroke="#451a03" strokeWidth="2"/>
      <polygon points="50,24 62,15 72,24 72,41 60,45" fill="none" stroke="#451a03" strokeWidth="2"/>
      <polygon points="72,41 85,45 90,58 78,69 64,69" fill="none" stroke="#451a03" strokeWidth="2"/>
      <polygon points="28,41 15,45 10,58 22,69 36,69" fill="none" stroke="#451a03" strokeWidth="2"/>
      <polygon points="36,69 50,78 64,69" fill="none" stroke="#451a03" strokeWidth="2"/>
      
      {/* Fill midnight blue panels on the outer border to make it look realistic */}
      <polygon points="38,15 50,24 62,15 50,8" fill="#1e1b4b" />
      <polygon points="72,41 85,45 78,32 72,24" fill="#1e1b4b" />
      <polygon points="28,41 15,45 22,32 28,24" fill="#1e1b4b" />
      <polygon points="64,69 78,69 70,82 58,82" fill="#1e1b4b" />
      <polygon points="36,69 22,69 30,82 42,82" fill="#1e1b4b" />
      
      {/* Ambient overlay */}
      <circle cx="50" cy="50" r="48" fill={`url(#${shadowOverlayId})`} pointerEvents="none" style={{ mixBlendMode: 'multiply' }}/>
    </svg>
  );
};
