import { useState, useEffect } from 'react';

interface Props {
  items: string[] | { text: string; author: string }[];
  variant: 'fact' | 'quote';
}

export const RotatingCard = ({ items, variant }: Props) => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * items.length));

  useEffect(() => {
    const day = new Date().getDate();
    setIndex(day % items.length);
  }, [items.length]);

  const item = items[index];

  if (variant === 'quote' && typeof item === 'object' && 'text' in item) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm italic text-foreground/90">"{item.text}"</p>
        <p className="mt-2 text-xs text-muted-foreground">— {item.author}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-l-4 border-l-accent bg-card p-4">
      <p className="text-xs font-medium text-accent mb-1">Did you know?</p>
      <p className="text-sm text-foreground/90">{typeof item === 'string' ? item : item.text}</p>
    </div>
  );
};
