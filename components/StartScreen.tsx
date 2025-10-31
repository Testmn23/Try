/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon, SaveIcon, Trash2Icon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import { SavedModel } from '../types';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
  onSaveModel: (name: string, imageUrl: string) => void;
  onDeleteModel: (id: string) => void;
  savedModels: SavedModel[];
  credits: number;
  onUseCredit: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ 
  onModelFinalized, 
  onSaveModel,
  onDeleteModel,
  savedModels,
  credits, 
  onUseCredit 
}) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }
    const modelNameSuggestion = `Model ${savedModels.length + 1}`;
    setModelName(modelNameSuggestion);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
            onUseCredit();
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, [onUseCredit, savedModels.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
    setModelName('');
  };

  const handleSaveAndUse = () => {
    if (!generatedModelUrl) return;
    onSaveModel(modelName.trim() || `Model ${savedModels.length + 1}`, generatedModelUrl);
  };
  
  const screenVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };

  return (
    <AnimatePresence mode="wait">
      {!userImageUrl ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-6xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Your Style, Reimagined.
              </h1>
              <p className="mt-4 text-lg font-sora text-stone-600 dark:text-stone-400">
                Create a personal digital model from a photo, or select a previously saved one to start styling.
              </p>
              <hr className="my-8 border-stone-200 dark:border-stone-800" />
              <div className="flex flex-col items-center lg:items-start w-full gap-3 font-sora">
                <label htmlFor="image-upload-start" className={`w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-fuchsia-500 rounded-md transition-all duration-200 ease-in-out ${credits <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group hover:bg-fuchsia-600'}`}>
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  Create a New Model
                </label>
                <input id="image-upload-start" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={credits <= 0} />
                {credits <= 0 && <p className="text-red-500 font-semibold text-sm mt-2">You need credits to generate a model.</p>}
                <p className="text-stone-500 dark:text-stone-400 text-sm">Use a clear, full-body photo for best results.</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 rounded-2xl bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
            <h2 className="text-2xl font-playfair font-bold text-stone-800 dark:text-stone-200 mb-4">Saved Models</h2>
            {savedModels.length > 0 ? (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {savedModels.map(model => (
                    <div key={model.id} className="relative group aspect-square">
                        <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover rounded-lg border border-stone-200 dark:border-stone-800" />
                        <div className="absolute inset-0 bg-stone-950/70 rounded-lg flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                           <p className="text-white font-bold text-sm text-center truncate w-full mb-2">{model.name}</p>
                           <button onClick={() => onModelFinalized(model.imageUrl)} className="w-full bg-fuchsia-500 text-white font-semibold py-2 px-3 rounded-md text-sm hover:bg-fuchsia-600 transition-colors">
                                Use
                           </button>
                           <button onClick={() => onDeleteModel(model.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white/80 hover:bg-red-500/80 hover:text-white transition-colors" aria-label="Delete model">
                                <Trash2Icon className="w-3 h-3" />
                           </button>
                        </div>
                    </div>
                  ))}
                </div>
            ) : (
                <p className="text-stone-500 dark:text-stone-400 text-sm">Your saved models will appear here.</p>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="compare"
          className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Meet Your Digital Twin.
              </h1>
              <p className="mt-2 text-md font-sora text-stone-600 dark:text-stone-400">
                The magic is done. Give your new model a name, or start over.
              </p>
            </div>
            
            {isGenerating && (
              <div className="flex items-center gap-3 text-lg text-stone-700 dark:text-stone-300 font-playfair mt-6">
                <Spinner />
                <span>Crafting your model...</span>
              </div>
            )}

            {error && 
              <div className="text-center md:text-left text-red-600 dark:text-red-500 max-w-md mt-6 font-sora">
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm mb-4">{error}</p>
                <button onClick={reset} className="text-sm font-semibold text-stone-700 dark:text-stone-300 hover:underline">Try Again</button>
              </div>
            }
            
            <AnimatePresence>
              {generatedModelUrl && !isGenerating && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-sm flex flex-col items-center md:items-start gap-4 mt-8 font-sora"
                >
                  <div className="w-full">
                    <label htmlFor="modelName" className="text-sm font-semibold text-stone-600 dark:text-stone-400">Model Name</label>
                    <input 
                      id="modelName"
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="e.g., My Casual Look"
                      className="mt-1 w-full p-2 rounded-md bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-shadow text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                    <button 
                      onClick={reset}
                      className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-stone-700 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 rounded-md cursor-pointer hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                    >
                      Start Over
                    </button>
                    <button 
                      onClick={handleSaveAndUse}
                      className="w-full sm:flex-grow relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-fuchsia-500 rounded-md cursor-pointer group hover:bg-fuchsia-600 transition-colors"
                    >
                      <SaveIcon className="w-5 h-5 mr-2" />
                      Save & Start Styling
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <div 
              className={`relative rounded-[1.25rem] transition-all duration-700 ease-in-out ${isGenerating ? 'border border-stone-300 dark:border-stone-700 animate-pulse' : 'border border-transparent'}`}
            >
              <Compare
                firstImage={userImageUrl}
                secondImage={generatedModelUrl ?? userImageUrl}
                slideMode="drag"
                className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-stone-200 dark:bg-stone-800"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;