/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { IdCardIcon, PortraitIcon } from './icons';

interface ProfessionalShotsPanelProps {
  onSelect: (prompt: string, loadingMessage: string) => void;
  isLoading: boolean;
  credits: number;
}

const headshotPrompt = "You are an expert AI portrait photographer. Transform the person in this image into a professional headshot suitable for a corporate profile or social media. **Crucial Rules:** 1. The photo should be a head-and-shoulders shot. 2. The person can have a slight, professional smile. 3. The background should be a clean, modern, and subtly blurred professional setting (like an office or a neutral studio backdrop). 4. The lighting should be flattering and professional. Return ONLY the final image.";
const passportPrompt = (bgColor: 'white' | 'red') => `You are an expert AI photo generator specializing in official documents. Transform the person in this image into a standard passport-style photograph. **Crucial Rules:** 1. The photo MUST be a front-facing, head-and-shoulders shot with a neutral expression. 2. The background MUST be a solid, uniform ${bgColor} color. 3. Remove any hats, non-prescription glasses, or distracting accessories. 4. The lighting must be even and professional, without shadows on the face or background. 5. The final image aspect ratio should be close to 3:4 (width:height). Return ONLY the final image.`;


const ProfessionalShotsPanel: React.FC<ProfessionalShotsPanelProps> = ({ onSelect, isLoading, credits }) => {
  const [showPassportOptions, setShowPassportOptions] = useState(false);

  const handleSelect = (type: 'headshot' | 'passport-white' | 'passport-red') => {
    if (isLoading || credits <= 0) return;
    
    let prompt = '';
    let loadingMessage = '';

    switch (type) {
      case 'headshot':
        prompt = headshotPrompt;
        loadingMessage = 'Generating Professional Headshot...';
        break;
      case 'passport-white':
        prompt = passportPrompt('white');
        loadingMessage = 'Generating Passport Photo...';
        break;
      case 'passport-red':
        prompt = passportPrompt('red');
        loadingMessage = 'Generating Passport Photo...';
        break;
    }
    onSelect(prompt, loadingMessage);
  };

  const isDisabled = isLoading || credits <= 0;

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 border-b border-stone-400/50 dark:border-stone-600/50 pb-2 mb-3">Professional Shots</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowPassportOptions(!showPassportOptions)}
          disabled={isDisabled}
          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
            showPassportOptions
              ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500'
              : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-fuchsia-500/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <IdCardIcon className="w-6 h-6" />
          <span>Passport</span>
        </button>
        <button
          onClick={() => handleSelect('headshot')}
          disabled={isDisabled}
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-fuchsia-500/50 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PortraitIcon className="w-6 h-6" />
          <span>Headshot</span>
        </button>
      </div>

      {showPassportOptions && (
        <div className="mt-3 p-3 bg-stone-100 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2 text-center">Choose Background Color</h3>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleSelect('passport-white')}
              disabled={isDisabled}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-stone-300 text-stone-800 font-semibold hover:bg-stone-200 disabled:opacity-50"
            >
              <div className="w-4 h-4 rounded-full bg-white border border-stone-400" />
              White
            </button>
            <button
              onClick={() => handleSelect('passport-red')}
              disabled={isDisabled}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 border border-red-700 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              <div className="w-4 h-4 rounded-full bg-red-600 border border-red-800" />
              Red
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalShotsPanel;