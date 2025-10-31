/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <svg
      className="h-20 w-20"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      <g className="text-fuchsia-500" filter="url(#glow)" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M 25 50 A 25 25 0 0 1 75 50">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="180 50 50"
            dur="1.5s"
            repeatCount="indefinite"
            keyTimes="0;1"
            keySplines="0.5 0 0.5 1"
          />
        </path>
        <path d="M 75 50 A 25 25 0 0 1 25 50">
           <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="-180 50 50"
            dur="1.5s"
            repeatCount="indefinite"
            keyTimes="0;1"
            keySplines="0.5 0 0.5 1"
          />
        </path>
         <path d="M 50 25 A 25 25 0 0 1 50 75">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="180 50 50"
                dur="1.5s"
                begin="-0.2s"
                repeatCount="indefinite"
                keyTimes="0;1"
                keySplines="0.5 0 0.5 1"
            />
        </path>
        <path d="M 50 75 A 25 25 0 0 1 50 25">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="-180 50 50"
                dur="1.5s"
                begin="-0.2s"
                repeatCount="indefinite"
                keyTimes="0;1"
                keySplines="0.5 0 0.5 1"
            />
        </path>
      </g>
      <g className="text-stone-300 dark:text-stone-700" stroke="currentColor" fill="none" strokeWidth="1" strokeLinecap="round">
        <circle cx="50" cy="50" r="38">
            <animate
                attributeName="stroke-dasharray"
                values="0 238; 238 0; 0 238"
                dur="3s"
                repeatCount="indefinite"
            />
             <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="8s"
                repeatCount="indefinite"
            />
        </circle>
         <circle cx="50" cy="50" r="12">
            <animate
                attributeName="stroke-dasharray"
                values="0 75; 75 0; 0 75"
                dur="3s"
                begin="-1.5s"
                repeatCount="indefinite"
            />
             <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 50 50"
                to="0 50 50"
                dur="6s"
                repeatCount="indefinite"
            />
        </circle>
      </g>
    </svg>
  );
};

export default Spinner;
