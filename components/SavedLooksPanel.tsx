/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SavedOutfit } from '../types';
import { Trash2Icon } from './icons';

interface SavedLooksPanelProps {
  savedOutfits: SavedOutfit[];
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (id: string) => void;
  isLoading: boolean;
}

const SavedLooksPanel: React.FC<SavedLooksPanelProps> = ({ savedOutfits, onLoadOutfit, onDeleteOutfit, isLoading }) => {
  if (savedOutfits.length === 0) {
    return null;
  }

  return (
    <div className="pt-6 border-t border-stone-400/50 dark:border-stone-600/50">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 mb-3">Saved Looks</h2>
      <div className="grid grid-cols-2 gap-3">
        {savedOutfits.map((outfit) => (
          <div key={outfit.id} className="relative group aspect-square">
            {/* Fix: Property 'thumbnailUrl' does not exist on type 'SavedOutfit'. Did you mean 'thumbnail_url'? */}
            <img
              src={outfit.thumbnail_url}
              alt={outfit.name}
              className="w-full h-full object-cover rounded-lg border border-stone-200 dark:border-stone-800"
            />
            <div className="absolute inset-0 bg-stone-950/70 rounded-lg flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
               <p className="text-white font-bold text-xs text-center truncate w-full mb-2">{outfit.name}</p>
              <button
                onClick={() => onLoadOutfit(outfit)}
                disabled={isLoading}
                className="w-3/4 bg-fuchsia-500 text-white font-semibold py-2 px-3 rounded-md text-sm hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
              >
                Load
              </button>
              <button
                onClick={() => onDeleteOutfit(outfit.id)}
                disabled={isLoading}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-red-500/80 hover:text-white transition-colors"
                aria-label="Delete saved look"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedLooksPanel;