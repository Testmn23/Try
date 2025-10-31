/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface FooterProps {
  isOnDressingScreen?: boolean;
  onOpenLegal: (contentKey: string) => void;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false, onOpenLegal }) => {
  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-t border-stone-200/60 dark:border-stone-800/60 p-3 z-50 ${isOnDressingScreen ? 'hidden sm:block' : ''}`}>
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 dark:text-stone-400 max-w-7xl px-4">
        <p>Powered by generative AI.</p>
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <button onClick={() => onOpenLegal('terms')} className="hover:underline">Terms of Service</button>
          <button onClick={() => onOpenLegal('privacy')} className="hover:underline">Privacy Policy</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;