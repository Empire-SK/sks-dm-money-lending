import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'sks_theme_preference';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';

    // Get trigger coordinates from click event, or default to center/bottom-left toggle area
    const x = event?.clientX ?? (window.innerWidth > 768 ? 60 : window.innerWidth - 60);
    const y = event?.clientY ?? (window.innerHeight > 768 ? window.innerHeight - 80 : 30);
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Modern View Transitions API with circular ripple wave
    // @ts-ignore
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // @ts-ignore
      const transition = document.startViewTransition(() => {
        setThemeState(nextTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
      return;
    }

    // High-performance DOM wave fallback for non-ViewTransition browsers
    try {
      const wave = document.createElement('div');
      wave.className = 'theme-transition-wave-fallback';
      wave.style.position = 'fixed';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.width = '0px';
      wave.style.height = '0px';
      wave.style.borderRadius = '50%';
      wave.style.backgroundColor = nextTheme === 'dark' ? '#09090b' : '#f4f5f7';
      wave.style.pointerEvents = 'none';
      wave.style.zIndex = '999999';
      wave.style.transform = 'translate(-50%, -50%)';
      wave.style.transition = 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1), height 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease 0.3s';
      wave.style.boxShadow = nextTheme === 'dark'
        ? '0 0 100px rgba(0,0,0,0.8)'
        : '0 0 100px rgba(255,255,255,0.9)';

      document.body.appendChild(wave);

      requestAnimationFrame(() => {
        wave.style.width = `${endRadius * 2.2}px`;
        wave.style.height = `${endRadius * 2.2}px`;
        wave.style.opacity = '0';
      });

      setTimeout(() => {
        wave.remove();
      }, 650);
    } catch {}

    setThemeState(nextTheme);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
