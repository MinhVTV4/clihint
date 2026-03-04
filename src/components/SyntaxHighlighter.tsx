import React from 'react';

interface SyntaxHighlighterProps {
  command: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ command }) => {
  if (!command) return null;

  const parts = command.split(/(\s+)/); // Split by whitespace but keep the whitespace

  return (
    <span className="break-all">
      {parts.map((part, index) => {
        // Whitespace
        if (/^\s+$/.test(part)) {
          return <span key={index}>{part}</span>;
        }

        // First non-whitespace part is usually the main command
        const isFirstWord = parts.slice(0, index).every(p => /^\s+$/.test(p));
        
        if (isFirstWord) {
          return <span key={index} className="text-emerald-400 font-semibold">{part}</span>;
        }

        // Flags/Options (start with - or --)
        if (part.startsWith('-')) {
          return <span key={index} className="text-yellow-300">{part}</span>;
        }

        // Strings (enclosed in quotes)
        if (part.startsWith('"') || part.startsWith("'")) {
          return <span key={index} className="text-amber-400">{part}</span>;
        }

        // Subcommands or arguments (default)
        return <span key={index} className="text-cyan-200">{part}</span>;
      })}
    </span>
  );
};
