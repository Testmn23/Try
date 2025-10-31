/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { MagicWandIcon, MusicIcon, HelpCircleIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptEditorProps {
  onGenerate: (prompt: string, mode: 'remix' | 'mixtape') => void;
  isLoading: boolean;
  credits: number;
}

const TOOLTIP_TEXT = {
  remix: "Use 'Remix' to edit the current image with specific instructions (e.g., 'change shirt to blue', 'add a hat').",
  mixtape: "Use 'Mixtape' to have the AI create a full outfit from your wardrobe based on a theme (e.g., 'beach party').",
};

const PromptEditor: React.FC<PromptEditorProps> = ({ onGenerate, isLoading, credits }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'remix' | 'mixtape'>('remix');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading || credits <= 0) return;
    onGenerate(prompt, mode);
  };

  const isButtonDisabled = !prompt.trim() || isLoading || credits <= 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">
        <div className="flex items-center gap-2">
            <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200">Creative AI</h2>
            <div className="relative">
                <button onMouseEnter={() => setIsTooltipVisible(true)} onMouseLeave={() => setIsTooltipVisible(false)} className="text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400">
                    <HelpCircleIcon className="w-4 h-4" />
                </button>
                <AnimatePresence>
                {isTooltipVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-center text-white bg-stone-800 rounded-md shadow-lg z-10"
                    >
                        {TOOLTIP_TEXT[mode]}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
        <div className="flex items-center p-1 rounded-full bg-stone-200/80 dark:bg-stone-800/80">
          <button 
            onClick={() => setMode('remix')}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${mode === 'remix' ? 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 shadow-sm' : 'text-stone-500'}`}
          >
            Remix
          </button>
          <button 
            onClick={() => setMode('mixtape')}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${mode === 'mixtape' ? 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 shadow-sm' : 'text-stone-500'}`}
          >
            Mixtape
          </button>
        </div>
      </div>
      
      <div 
        className="relative p-0.5 rounded-lg transition-all duration-300"
        style={{
          '--angle': '0deg',
          backgroundImage: `linear-gradient(var(--angle), rgba(217, 70, 239, 0.5), rgba(217, 70, 239, 0.1), rgba(217, 70, 239, 0.5))`,
          animation: '5s linear infinite animated-border',
        } as React.CSSProperties}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'remix' ? "e.g., Change shirt to blue..." : "e.g., Beach party, city explorer..."}
          rows={3}
          disabled={isLoading || credits <= 0}
          className="w-full p-3 rounded-[7px] bg-stone-50 dark:bg-stone-950 border-none focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-shadow text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 disabled:opacity-60"
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="mt-3 w-full flex items-center justify-center text-center bg-fuchsia-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-fuchsia-600 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mode === 'remix' ? <MagicWandIcon className="w-4 h-4 mr-2" /> : <MusicIcon className="w-4 h-4 mr-2" />}
        {mode === 'remix' ? 'Remix Style' : 'Generate Mixtape'}
      </button>
    </div>
  );
};

export default PromptEditor;