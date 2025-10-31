/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SunIcon, MoonIcon, MonitorIcon } from './icons';
import { Theme } from '../types';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const options: { name: Theme, icon: React.ReactNode }[] = [
    { name: 'light', icon: <SunIcon className="w-5 h-5" /> },
    { name: 'dark', icon: <MoonIcon className="w-5 h-5" /> },
    { name: 'system', icon: <MonitorIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex items-center p-1 rounded-full bg-stone-200/80 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 backdrop-blur-sm">
      {options.map((option) => (
        <button
          key={option.name}
          onClick={() => setTheme(option.name)}
          className={`p-2 rounded-full transition-colors ${
            theme === option.name
              ? 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          aria-label={`Switch to ${option.name} theme`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
