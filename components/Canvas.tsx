/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RotateCcwIcon, UserPlusIcon, DiceIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  onNewModel: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  credits: number;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, onNewModel, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex }) => {
  
  const handleCyclePose = () => {
    if (isLoading) return;
    const newIndex = (currentPoseIndex + 1) % poseInstructions.length;
    onSelectPose(newIndex);
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in">
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button 
            onClick={onNewModel}
            className="flex items-center justify-center text-center bg-stone-50/60 dark:bg-stone-950/60 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 active:scale-95 text-sm backdrop-blur-sm"
        >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            New Model
        </button>
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center text-center bg-stone-50/60 dark:bg-stone-950/60 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 font-semibold py-2 px-3 rounded-full transition-all duration-200 ease-in-out hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 active:scale-95 text-sm backdrop-blur-sm"
            aria-label="Start Over"
        >
            <RotateCcwIcon className="w-4 h-4" />
        </button>
      </div>


      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg shadow-2xl dark:shadow-stone-950"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-stone-200/50 dark:bg-stone-800/50 border border-stone-300/50 dark:border-stone-700/50 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-playfair text-stone-600 dark:text-stone-400 mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-playfair text-stone-700 dark:text-stone-300 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayImageUrl && (
        <div 
          className={`absolute top-12 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        >
          <button
            onClick={handleCyclePose}
            aria-label="Next pose"
            className="flex items-center justify-center gap-2 bg-stone-50/60 dark:bg-stone-950/60 backdrop-blur-md rounded-full py-2 px-4 border border-stone-300/50 dark:border-stone-700/50 shadow-lg shadow-fuchsia-500/10 active:scale-95 transition-all disabled:opacity-50"
            disabled={isLoading}
          >
            <DiceIcon className="w-4 h-4 text-stone-800 dark:text-stone-200" />
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 w-auto text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;