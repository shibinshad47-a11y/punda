'use client';

import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, Zap } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🥳', '😏', '🤔', '🤫', '🤭', '🥱', '😴', '🥺', '😭', '🤯', '😱', '🥵', '🥶', '😷', '🤒', '🤕'],
  },
  {
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '👂', '👃', '👀'],
  },
  {
    name: 'Hearts',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '⭐', '🌟', '💥', '💯'],
  },
  {
    name: 'Objects',
    icon: Zap,
    emojis: ['🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '🎾', '🎧', '📱', '💻', '💡', '🔔', '🚀', '✈️', '🚗', '🛵', '🚲', '🍕', '🍔', '🍟', '🍣', '☕', '🍺'],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div
      className="w-72 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#2f3b43] overflow-hidden flex flex-col z-50 select-none animate-in fade-in zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Category selector */}
      <div className="flex items-center justify-around bg-zinc-100 dark:bg-[#111b21] border-b border-zinc-200 dark:border-[#2f3b43] p-1.5">
        {EMOJI_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(idx)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeCategory === idx
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title={cat.name}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 grid grid-cols-7 gap-1.5 max-h-56 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="w-8 h-8 flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-[#111b21] rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
