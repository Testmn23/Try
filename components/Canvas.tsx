/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import LoadingOverlay from './LoadingOverlay';

interface CanvasProps {
  imageUrl: string | null;
  loadingMessage: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ imageUrl, loadingMessage }) => {
  const isLoading = loadingMessage !== null;

  return (
    <div className="relative w-full h-full max-w-lg aspect-[2/3] bg-stone-200 dark:bg-stone-800/50 rounded-2xl flex items-center justify-center overflow-hidden border border-stone-300/50 dark:border-stone-700/50 shadow-inner">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Generated model"
          className="w-full h-full object-contain transition-opacity duration-500"
          style={{ opacity: isLoading ? 0.5 : 1 }}
        />
      ) : (
        <div className="text-center text-stone-500 dark:text-stone-400">
          <p>Your model will appear here.</p>
        </div>
      )}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};

export default Canvas;
