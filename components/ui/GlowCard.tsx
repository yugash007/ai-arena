import React, { useRef, useEffect } from 'react';

const styles = `
.sui-glow-card-wrapper {
  --backdrop: hsl(0 0% 60% / 0.12);
  --radius: 12;
  --border: 2;
  --backup-border: var(--backdrop);
  --size: 200;
  --hue: 120;
}

.sui-glow-card {
  position: relative;
  border-radius: calc(var(--radius) * 1px);
  box-shadow: 0 1rem 2rem -1rem black;
  backdrop-filter: blur(calc(var(--cardblur, 5) * 1px));
}

/* Glow specific styles */
[data-glow] {
  --border-size: calc(var(--border, 2) * 1px);
  --spotlight-size: calc(var(--size, 150) * 1px);
  background-image: radial-gradient(
    var(--spotlight-size) var(--spotlight-size) at calc(var(--x, 0) * 1px) calc(
        var(--y, 0) * 1px
      ),
    hsl(
      var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(
          var(--lightness, 70) * 1%
        ) / var(--bg-spot-opacity, 0.1)
    ),
    transparent
  );
  background-color: var(--backdrop, transparent);
  background-size: calc(100% + (2 * var(--border-size))) calc(
      100% + (2 * var(--border-size))
    );
  background-position: 50% 50%;
  background-attachment: fixed;
  border: var(--border-size) solid var(--backup-border);
  position: relative;
  touch-action: none;
}

[data-glow]::before,
[data-glow]::after {
  pointer-events: none;
  content: '';
  position: absolute;
  inset: calc(var(--border-size) * -1);
  border: var(--border-size) solid transparent;
  border-radius: calc(var(--radius) * 1px);
  background-attachment: fixed;
  background-size: calc(100% + (2 * var(--border-size))) calc(
      100% + (2 * var(--border-size))
    );
  background-repeat: no-repeat;
  background-position: 50% 50%;
  mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
  mask-clip: padding-box, border-box;
  mask-composite: intersect;
}

/* This is the emphasis light */
[data-glow]::before {
  background-image: radial-gradient(
    calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
    hsl(
      var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(
          var(--lightness, 50) * 1%
        ) / var(--border-spot-opacity, 1)
    ),
    transparent 100%
  );
  filter: brightness(2);
}

/* This is the spotlight */
[data-glow]::after {
  background-image: radial-gradient(
    calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at calc(
        var(--x, 0) * 1px
      ) calc(var(--y, 0) * 1px),
    hsl(0 100% 100% / var(--border-light-opacity, 1)),
    transparent 100%
  );
}

[data-glow] [data-glow] {
  position: absolute;
  inset: 0;
  will-change: filter;
  opacity: var(--outer, 1);
}

[data-glow] > [data-glow] {
  border-radius: calc(var(--radius) * 1px);
  border-width: calc(var(--border-size) * 20);
  filter: blur(calc(var(--border-size) * 10));
  background: none;
  pointer-events: none;
}

[data-glow] > [data-glow]::before {
  inset: -10px;
  border-width: 10px;
}

[data-glow] [data-glow] {
  border: none;
}
`;

interface GlowCardWrapperProps {
  children: React.ReactNode;
  hue?: number;
  size?: number;
  border?: number;
  radius?: number;
  className?: string;
}

export const GlowCardWrapper: React.FC<GlowCardWrapperProps> = ({ 
  children, 
  hue = 120, 
  size = 200, 
  border = 2, 
  radius = 10,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (containerRef.current) {
        const x = e.clientX;
        const y = e.clientY;
        containerRef.current.style.setProperty('--x', x.toFixed(2));
        containerRef.current.style.setProperty('--y', y.toFixed(2));
        containerRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        containerRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`sui-glow-card-wrapper ${className}`}
      style={{
        '--hue': hue,
        '--size': size,
        '--border': border,
        '--radius': radius,
      } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {children}
    </div>
  );
};

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlowCard: React.FC<GlowCardProps> = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`sui-glow-card ${className}`} 
      data-glow 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div data-glow></div>
      {children}
    </div>
  );
};
