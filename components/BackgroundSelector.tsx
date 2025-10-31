/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { CityIcon, BeachIcon, CafeIcon, BuildingIcon, GalleryIcon } from './icons';

interface BackgroundSelectorProps {
  onSelect: (prompt: string, loadingMessage: string) => void;
  isLoading: boolean;
  credits: number;
}

const colorOptions = [
  { name: 'Default', value: 'default', color: 'bg-transparent border-stone-400', prompt: '' },
  { name: 'Light Gray', value: 'light-gray', color: 'bg-[#f0f0f0]', prompt: 'Change the background to a clean, solid light gray (#f0f0f0) studio backdrop.' },
  { name: 'White', value: 'white', color: 'bg-white', prompt: 'Change the background to a clean, solid white studio backdrop.' },
  { name: 'Beige', value: 'beige', color: 'bg-[#f5f5dc]', prompt: 'Change the background to a clean, solid beige (#f5f5dc) studio backdrop.' },
  { name: 'Charcoal', value: 'charcoal', color: 'bg-[#36454F]', prompt: 'Change the background to a clean, solid charcoal (#36454F) studio backdrop.' },
  { name: 'Sky Blue', value: 'sky-blue', color: 'bg-[#87CEEB]', prompt: 'Change the background to a clean, solid sky blue (#87CEEB) studio backdrop.' },
  { name: 'Sage Green', value: 'sage-green', color: 'bg-[#B2AC88]', prompt: 'Change the background to a clean, solid sage green (#B2AC88) studio backdrop.' },
];

const sceneOptions = [
    { name: 'City', value: 'city', icon: <CityIcon className="w-5 h-5"/>, prompt: 'Place the person on a bustling, realistic city street at golden hour, with soft light and blurred background buildings.' },
    { name: 'Beach', value: 'beach', icon: <BeachIcon className="w-5 h-5"/>, prompt: 'Place the person on a serene, photorealistic sandy beach with gentle waves and a clear blue sky.' },
    { name: 'Cafe', value: 'cafe', icon: <CafeIcon className="w-5 h-5"/>, prompt: 'Place the person inside a cozy, modern cafe with warm lighting and a softly blurred interior background.' },
    { name: 'Loft', value: 'loft', icon: <BuildingIcon className="w-5 h-5"/>, prompt: 'Place the person in a modern, sun-drenched studio loft with large windows and a clean, minimalist aesthetic.' },
    { name: 'Office', value: 'office', icon: <BuildingIcon className="w-5 h-5" />, prompt: 'Place the person in a sleek, modern office environment with a professional and blurred background.'},
    { name: 'Gallery', value: 'gallery', icon: <GalleryIcon className="w-5 h-5" />, prompt: 'Place the person in a bright, minimalist art gallery with abstract paintings softly blurred on the walls.'},
]

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onSelect, isLoading, credits }) => {
  const [activeBg, setActiveBg] = useState('default');

  const handleSelect = (option: {value: string, prompt: string}, type: 'color' | 'scene') => {
    if (isLoading || credits <= 0 || option.value === 'default' || option.value === activeBg) return;
    setActiveBg(option.value);
    onSelect(option.prompt, `Changing the scene...`);
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">Change Background</h2>
      
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Colors</h3>
        <div className="flex items-center gap-3 flex-wrap">
            {colorOptions.map(option => (
            <button
                key={option.value}
                onClick={() => handleSelect(option, 'color')}
                disabled={isLoading || credits <= 0 || option.value === 'default'}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                activeBg === option.value 
                    ? 'border-fuchsia-500 scale-110' 
                    : 'border-stone-300 dark:border-stone-700'
                } ${option.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={option.name}
            />
            ))}
        </div>
      </div>
      
       <div>
        <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">Scenes</h3>
        <div className="flex items-center gap-3 flex-wrap">
            {sceneOptions.map(option => (
            <button
                key={option.value}
                onClick={() => handleSelect(option, 'scene')}
                disabled={isLoading || credits <= 0}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all ${
                activeBg === option.value 
                    ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500' 
                    : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-fuchsia-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={option.name}
            >
                {option.icon}
                <span className="text-xs font-semibold mt-1">{option.name}</span>
            </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;