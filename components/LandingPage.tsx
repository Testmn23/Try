/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';
import { Compare } from './ui/compare';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="max-w-lg">
            <h1 className="text-5xl md:text-7xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
              Dress Without Limits.
            </h1>
            <p className="mt-4 text-lg font-sora text-stone-600 dark:text-stone-400">
              Your virtual dressing room awaits. See any outfit on you in seconds. Upload a photo, choose a style, and transform your look.
            </p>
            <hr className="my-8 border-stone-200 dark:border-stone-800" />
            <motion.button
              onClick={onEnter}
              className="w-full font-sora sm:w-auto flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-fuchsia-500 rounded-lg cursor-pointer group hover:bg-fuchsia-600 transition-colors shadow-lg shadow-fuchsia-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Styling &rarr;
            </motion.button>
             <p className="text-stone-500 font-sora dark:text-stone-400 text-xs mt-4">
               By entering, you agree to our Terms of Service. Powered by generative AI.
             </p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Compare
              firstImage="/showcase-male-before.jpg"
              secondImage="/showcase-male-after.png"
              slideMode="hover"
              autoplay={true}
              className="w-full max-w-[240px] aspect-[2/3] rounded-2xl bg-stone-200 dark:bg-stone-800 shadow-2xl dark:shadow-stone-950"
            />
             <Compare
              firstImage="/showcase-female-before.jpg"
              secondImage="/showcase-female-after.png"
              slideMode="hover"
              autoplay={true}
              className="w-full max-w-[240px] aspect-[2/3] rounded-2xl bg-stone-200 dark:bg-stone-800 shadow-2xl dark:shadow-stone-950"
            />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;