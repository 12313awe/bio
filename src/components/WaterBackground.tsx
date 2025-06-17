
import React, { useEffect, useState } from 'react';

const WaterBackground = ({ children }: { children: React.ReactNode }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const createRipple = () => {
      const newRipple = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 2000);
    };

    const interval = setInterval(createRipple, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="water-container min-h-screen water-background relative">
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple w-8 h-8"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default WaterBackground;
