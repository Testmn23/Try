/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { MusicIcon } from './icons';

interface StyleMixtapePanelProps {
  onGenerate: (theme: string) => void;
  isLoading: boolean;
  credits: number;
}

const StyleMixtapePanel: React.FC<StyleMixtapePanelProps> = ({ onGenerate, isLoading, credits }) => {
  const [theme, setTheme] = useState('');

  const handleGenerate = () => {
    if (!theme.trim() || isLoading || credits <= 0) return;
    onGenerate(theme);
  };

  const isButtonDisabled = !theme.trim() || isLoading || credits <= 0;

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">Style Mixtape</h2>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., Beach party, city explorer..."
          disabled={isLoading || credits <= 0}
          className="flex-grow p-2 rounded-md bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-shadow text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 disabled:opacity-60"
        />
        <button
          onClick={handleGenerate}
          disabled={isButtonDisabled}
          className="flex-shrink-0 flex items-center justify-center text-center bg-fuchsia-500 text-white font-semibold p-2 rounded-md transition-all duration-200 ease-in-out hover:bg-fuchsia-600 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate AI Outfit"
          >
          <MusicIcon className="w-5 h-5" />
        </button>
      </div>
       <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Let AI create an outfit for you based on a theme.</p>
    </div>
  );
};

export default StyleMixtapePanel;