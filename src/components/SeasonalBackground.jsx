import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// 🟢 THEME DICTIONARY: Using stable, high-quality 3D Fluent Emojis
const THEMES = {
  holi: {
    direction: 'up', // Floats up
    opacity: 0.4,
    images: [
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Artist%20Palette.png", // Colors
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Water%20Pistol.png", // Pichkari
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Droplet.png", // Water drop
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png" // Magic sparkles
    ]
  },
  exams: {
    direction: 'up', // Floats up gently
    opacity: 0.25, // Lighter so it doesn't distract from shopping
    images: [
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Books.png", // Books
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Memo.png", // Pencil/Paper
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Light%20Bulb.png", // Idea
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Graduation%20Cap.png"  // Success
    ]
  },
  shradh: {
    direction: 'down', // Falls gently like blessings/flowers
    opacity: 0.3,
    images: [
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals%20and%20Nature/Lotus.png", // Lotus
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals%20and%20Nature/Rosette.png", // Marigold-like
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals%20and%20Nature/Dove.png" // Peace
    ]
  }
};

const SeasonalBackground = ({ theme = 'holi' }) => {
  // Fallback to holi if an invalid theme is passed
  const activeTheme = THEMES[theme] || THEMES.holi;

  // 🧠 SENIOR LOGIC: useMemo prevents recalculating random positions on every re-render
  const elements = useMemo(() => {
    return [...Array(14)].map((_, index) => {
      const image = activeTheme.images[index % activeTheme.images.length];
      
      return {
        id: index,
        image,
        size: Math.random() * 40 + 30, // 30px to 70px
        startX: Math.random() * 100, // 0% to 100% width
        duration: Math.random() * 15 + 15, // 15s to 30s float time
        delay: Math.random() * 10, // Staggered start
        rotation: Math.random() * 360, // Random starting rotation
      };
    });
  }, [activeTheme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((el) => {
        // Determine animation direction based on theme
        const isFalling = activeTheme.direction === 'down';
        const startY = isFalling ? '-20vh' : '120vh';
        const endY = isFalling ? '120vh' : '-20vh';

        return (
          <motion.img
            key={el.id}
            src={el.image}
            alt="seasonal decoration"
            className="absolute drop-shadow-lg"
            style={{
              width: el.size,
              height: el.size,
              left: `${el.startX}%`,
              opacity: activeTheme.opacity,
            }}
            initial={{ 
                y: startY, 
                x: 0, 
                rotate: el.rotation 
            }}
            animate={{
              y: endY, 
              x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100], // Gentle swaying left and right
              rotate: el.rotation + (Math.random() > 0.5 ? 360 : -360), // Slow spin
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              ease: "linear",
              delay: el.delay,
            }}
          />
        );
      })}
    </div>
  );
};

export default SeasonalBackground;