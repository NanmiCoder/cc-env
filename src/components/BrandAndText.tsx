import { useEffect, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+~|';

export function ScrambleIn({
  text,
  delay = 0,
  triggered = true,
  className = '',
}: {
  text: string;
  delay?: number;
  triggered?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState<string>('');

  useEffect(() => {
    if (!triggered) {
      setDisplay('');
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      let cursor = 0;
      intervalId = setInterval(() => {
        cursor += 0.65;
        let out = '';
        for (let i = 0; i < text.length; i += 1) {
          const ch = text[i];
          if (ch === ' ') {
            out += ' ';
          } else if (i < Math.floor(cursor)) {
            out += ch;
          } else if (i < Math.floor(cursor) + 3) {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            out += '';
          }
        }
        setDisplay(out);
        if (cursor >= text.length) {
          setDisplay(text);
          if (intervalId) clearInterval(intervalId);
        }
      }, 25);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, triggered]);

  return <span className={className}>{display || '\u00A0'}</span>;
}

/** Claude / Claude Code 12-ray starburst ("菊花") logo */
export function ClaudeFlowerLogo({ className = 'h-5 w-5' }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {rays.map((deg) => (
        <rect
          key={deg}
          x="45.5"
          y="8"
          width="9"
          height="32"
          rx="4.5"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="11" />
    </svg>
  );
}
