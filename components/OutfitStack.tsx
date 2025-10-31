/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, HistoryIcon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  currentOutfitIndex: number;
  onRemoveLastGarment: () => void;
  onRevertToOutfit: (index: number) => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, currentOutfitIndex, onRemoveLastGarment, onRevertToOutfit }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">Outfit History</h2>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => {
          const isCurrent = index === currentOutfitIndex;
          const isFuture = index > currentOutfitIndex;

          return (
            <div
              key={layer.garment?.id || `base-${index}`}
              className={`flex items-center justify-between bg-stone-100/50 dark:bg-stone-900/50 p-2 rounded-lg animate-fade-in border transition-all duration-300 ${
                isCurrent ? 'border-fuchsia-500/80 shadow-md' : 'border-stone-200/80 dark:border-stone-800/80'
              } ${isFuture ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 rounded-full">
                  {index + 1}
                </span>
                {layer.garment ? (
                  <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-md mr-3" />
                )}
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate" title={layer.garment?.name}>
                  {layer.garment ? layer.garment.name : 'Base Model'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isCurrent && !isFuture && (
                  <button
                    onClick={() => onRevertToOutfit(index)}
                    className="flex-shrink-0 text-stone-500 dark:text-stone-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-500 transition-colors p-2 rounded-md hover:bg-fuchsia-500/10"
                    aria-label={`Revert to ${layer.garment?.name || 'Base Model'}`}
                  >
                    <HistoryIcon className="w-5 h-5" />
                  </button>
                )}
                {isCurrent && index > 0 && (
                  <button
                    onClick={onRemoveLastGarment}
                    className="flex-shrink-0 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-500/10"
                    aria-label={`Remove ${layer.garment?.name}`}
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {outfitHistory.length === 0 && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400 pt-4">Your outfit history will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;