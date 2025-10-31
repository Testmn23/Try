/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
// Fix: Import the 'Variants' type from framer-motion.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { Theme } from '../types';
import ThemeSwitcher from './ThemeSwitcher';
import { UserIcon, LogOutIcon, SparklesIcon } from './icons';

interface ProfileMenuProps {
  session: Session;
  credits: number;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onSignOut: () => void;
  onAddCredits: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ session, credits, theme, setTheme, onSignOut, onAddCredits }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fix: Explicitly type menuVariants with the 'Variants' type.
  const menuVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 bg-stone-50/60 dark:bg-stone-950/60 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 rounded-full transition-all duration-200 ease-in-out hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 active:scale-95 backdrop-blur-sm"
        aria-label="Open user menu"
      >
        <UserIcon className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute top-full right-0 mt-2 w-72 origin-top-right bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-lg rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xl z-50"
          >
            <div className="p-4">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3 mb-3">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate" title={session.user.email ?? ''}>
                  {session.user.email}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 bg-stone-100 dark:bg-stone-900/80 rounded-lg border border-stone-200/60 dark:border-stone-800/60 mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Credits</p>
                  <p className="text-2xl font-bold font-sora text-stone-800 dark:text-stone-200">{credits}</p>
                </div>
                <button 
                  onClick={() => { onAddCredits(); setIsOpen(false); }}
                  className="flex items-center justify-center text-center bg-stone-800 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-200 ease-in-out hover:bg-stone-600 active:scale-95 text-sm"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Get More
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">Theme</p>
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
              </div>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 text-sm font-semibold text-stone-700 dark:text-stone-300 p-2 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <LogOutIcon className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
