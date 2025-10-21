import React from 'react';

interface PrimisLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function PrimisLogo({ 
  variant = 'light', 
  size = 'md',
  showTagline = true 
}: PrimisLogoProps) {
  const sizeClasses = {
    sm: {
      text: 'text-xl',
      tagline: 'text-[10px]',
      spacing: 'tracking-[0.3em]',
      taglineSpacing: 'tracking-[0.2em]',
    },
    md: {
      text: 'text-3xl',
      tagline: 'text-xs',
      spacing: 'tracking-[0.4em]',
      taglineSpacing: 'tracking-[0.25em]',
    },
    lg: {
      text: 'text-5xl',
      tagline: 'text-sm',
      spacing: 'tracking-[0.5em]',
      taglineSpacing: 'tracking-[0.3em]',
    },
  };

  const colorClasses = {
    light: 'text-white',
    dark: 'text-primis-navy',
  };

  const classes = sizeClasses[size];
  const color = colorClasses[variant];

  return (
    <div className="flex flex-col items-center">
      <h1 
        className={`${classes.text} ${color} font-serif font-light ${classes.spacing} uppercase`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        PRIMIS
      </h1>
      {showTagline && (
        <p 
          className={`${classes.tagline} ${color} font-light ${classes.taglineSpacing} uppercase mt-1`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          EDUCARE
        </p>
      )}
    </div>
  );
}
