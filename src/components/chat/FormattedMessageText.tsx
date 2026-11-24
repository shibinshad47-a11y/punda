'use client';

import React from 'react';

interface FormattedMessageTextProps {
  content: string;
  className?: string;
  onMentionClick?: (username: string) => void;
}

export const FormattedMessageText: React.FC<FormattedMessageTextProps> = ({
  content,
  className = '',
  onMentionClick,
}) => {
  if (!content) return null;

  // Function to parse *bold*, _italic_, ~strike~, @mentions, and URLs safely
  const renderFormattedTokens = (text: string) => {
    // Regex splits by:
    // 1. URLs
    // 2. Mentions @username
    // 3. *bold*
    // 4. _italic_
    // 5. ~strike~
    const regex = /((?:https?:\/\/[^\s]+)|(?:@[a-zA-Z0-9_]+)|(?:\*[^*]+\*)|(?:_[^_]+_)|(?:~[^~]+~))/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 underline break-all hover:text-emerald-400"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }

      // @mention
      if (part.startsWith('@') && part.length > 1) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onMentionClick?.(username);
            }}
            className="text-emerald-500 font-semibold cursor-pointer hover:underline bg-emerald-500/10 px-1 py-0.5 rounded"
          >
            {part}
          </span>
        );
      }

      // *bold*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <strong key={index} className="font-bold">{part.slice(1, -1)}</strong>;
      }

      // _italic_
      if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }

      // ~strike~
      if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
        return <del key={index} className="line-through opacity-75">{part.slice(1, -1)}</del>;
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
      {renderFormattedTokens(content)}
    </div>
  );
};
