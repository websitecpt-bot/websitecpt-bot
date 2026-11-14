import React from 'react';

interface CptLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Official CPT Markets Logo matching screenshot image_c5253fc3.png:
 * White circular badge with cyan paper-airplane arrow pointing up-right and mint-teal circle dot below it.
 */
export const CptLogo: React.FC<CptLogoProps> = ({ size = 36, className = '', showText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Circle Icon Badge */}
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-white flex items-center justify-center shadow-md shadow-cyan-500/10 shrink-0 p-1"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyan Arrow / Paper Plane pointing up-right */}
          <path
            d="M28 62 L80 20 L48 78 L44 56 Z"
            fill="#00B2FF"
            stroke="#00B2FF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M48 78 L80 20 L58 48 Z"
            fill="#008FD5"
            opacity="0.8"
          />
          {/* Mint Teal Dot below the wing */}
          <circle cx="34" cy="74" r="14" fill="#00E5B0" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight font-sans">
          <span className="font-extrabold text-xl text-white">CPT</span>
          <span className="font-extrabold text-xl text-amber-400 ml-1.5">Markets</span>
          <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[9px] font-bold text-amber-400 uppercase tracking-tighter">
            ★ 18 YRS
          </span>
        </div>
      )}
    </div>
  );
};
