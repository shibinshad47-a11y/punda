'useclient';

import React from 'react';

interface PundaLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textColor?: string;
  subtext?: boolean;
}

export const PundaLogo: React.FC<PundaLogoProps> = ({
  size = 48,
  className = '',
  withText = false,
  textColor,
  subtext = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0 drop-shadow-md transition-transform hover:scale-105"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Primary chat bubble green gradient */}
            <linearGradient id="pundaGreenGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>

            {/* Spark golden/white gradient */}
            <radialGradient id="pundaSparkGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="60%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </radialGradient>

            {/* Subtle inner shadow filter */}
            <filter id="pundaShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Rounded chat bubble background with pointer tail */}
          <path
            d="M 22 14 
               C 12 14, 6 20, 6 32 
               L 6 62 
               C 6 74, 12 80, 24 80 
               L 32 80 
               L 26 92 
               C 25 94, 27 96, 29 95 
               L 46 80 
               L 78 80 
               C 90 80, 96 74, 96 62 
               L 96 32 
               C 96 20, 90 14, 78 14 
               Z"
            fill="url(#pundaGreenGrad)"
            filter="url(#pundaShadow)"
          />

          {/* Stylized 'P' letter path inside */}
          <path
            d="M 33 28 
               L 52 28 
               C 62 28, 68 33, 68 42 
               C 68 51, 62 56, 52 56 
               L 43 56 
               L 43 72 
               C 43 73.5, 41.5 75, 39.5 75 
               L 36.5 75 
               C 34.5 75, 33 73.5, 33 72 
               Z 
               M 43 37 
               L 43 47 
               L 50 47 
               C 55 47, 58 45, 58 42 
               C 58 39, 55 37, 50 37 
               Z"
            fill="#FFFFFF"
          />

          {/* Spark / Accent dot at top right */}
          <circle cx="76" cy="24" r="6" fill="url(#pundaSparkGrad)" />
          {/* Spark rays */}
          <path
            d="M 76 14 L 76 17 M 76 31 L 76 34 M 66 24 L 69 24 M 83 24 L 86 24"
            stroke="#FEF08A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-2xl font-sans ${
                textColor || 'text-zinc-900 dark:text-white'
              }`}
            >
              PUNDA
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          {subtext && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              Real-time Messaging
            </span>
          )}
        </div>
      )}
    </div>
  );
};
