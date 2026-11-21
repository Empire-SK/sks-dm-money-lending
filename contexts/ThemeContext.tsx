import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

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

  const isTransitioningRef = useRef(false);

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
    if (isTransitioningRef.current) return;

    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';

    // 1. Precise origin coordinates (clientX / clientY or element center fallback)
    let x = window.innerWidth >= 768 ? 64 : window.innerWidth - 64;
    let y = window.innerHeight >= 768 ? window.innerHeight - 80 : 36;

    if (event) {
      if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.currentTarget && 'getBoundingClientRect' in event.currentTarget) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // 2. Maximum radius to guarantee the wave fully covers all 4 screen corners
    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      ) * 1.05
    );

    const root = document.documentElement;

    // Check if View Transitions API is supported & user has not requested reduced motion
    // @ts-ignore
    const hasViewTransitions =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasViewTransitions) {
      isTransitioningRef.current = true;

      // Temporarily disable individual CSS transitions on elements so the snapshot captures the final target styling instantly with zero mid-flight animation tearing
      root.classList.add('theme-transitioning');

      try {
        // @ts-ignore
        const transition = (document as any).startViewTransition(() => {
          flushSync(() => {
            setThemeState(nextTheme);
            if (nextTheme === 'dark') {
              root.classList.add('dark');
              root.classList.remove('light');
            } else {
              root.classList.add('light');
              root.classList.remove('dark');
            }
            try {
              localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            } catch {}
          });
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          const animation = document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 780,
              easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );

          animation.onfinish = () => {
            root.classList.remove('theme-transitioning');
            isTransitioningRef.current = false;
          };
        }).catch(() => {
          root.classList.remove('theme-transitioning');
          isTransitioningRef.current = false;
        });

        transition.finished.finally(() => {
          root.classList.remove('theme-transitioning');
          isTransitioningRef.current = false;
        });

        // Safety fallback timer to guarantee flag reset
        setTimeout(() => {
          root.classList.remove('theme-transitioning');
          isTransitioningRef.current = false;
        }, 950);
        return;
      } catch (err) {
        root.classList.remove('theme-transitioning');
        isTransitioningRef.current = false;
      }
    }

    // High-performance smooth fallback for non-ViewTransition browsers
    isTransitioningRef.current = true;
    root.classList.add('theme-fallback-transition');
    setThemeState(nextTheme);
    if (nextTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}

    setTimeout(() => {
      root.classList.remove('theme-fallback-transition');
      isTransitioningRef.current = false;
    }, 450);
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
