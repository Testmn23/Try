/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { SquareIcon, RectangleVerticalIcon } from './icons';

interface AspectRatioSelectorProps {
  onSelect: (prompt: string, loadingMessage: string) => void;
  isLoading: boolean;
  credits: number;
}

const ratioOptions = [
  { name: 'Original', value: 'original', icon: null, prompt: '' },
  { name: 'Square (1:1)', value: '1:1', icon: <SquareIcon className="w-5 h-5"/>, prompt: 'Regenerate the entire image to fit a 1:1 square aspect ratio. Do not crop the person; redraw the scene to fit the new dimensions naturally.' },
  { name: 'Portrait (4:5)', value: '4:5', icon: <RectangleVerticalIcon className="w-5 h-5"/>, prompt: 'Regenerate the entire image to fit a 4:5 portrait aspect ratio. Do not crop the person; redraw the scene to fit the new dimensions naturally.' },
];

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ onSelect, isLoading, credits }) => {
  const [activeRatio, setActiveRatio] = useState('original');

  const handleSelect = (option: typeof ratioOptions[number]) => {
    if (isLoading || credits <= 0 || option.value === 'original' || option.value === activeRatio) return;
    setActiveRatio(option.value);
    onSelect(option.prompt, `Changing aspect ratio to ${option.value}...`);
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">Aspect Ratio</h2>
        <div className="flex items-center gap-3">
            {ratioOptions.map(option => (
                <button
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    disabled={isLoading || credits <= 0 || option.value === 'original'}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                    activeRatio === option.value 
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500' 
                        : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-fuchsia-500/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={option.name}
                >
                    {option.icon}
                    <span>{option.value}</span>
                </button>
            ))}
        </div>
    </div>
  );
};

export default AspectRatioSelector;