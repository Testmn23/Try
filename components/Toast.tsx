/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangleIcon, CheckIcon, XIcon } from './icons'; // Assuming info icon is not needed for now

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckIcon className="w-5 h-5" />,
    bg: 'bg-green-500/10 dark:bg-green-500/5',
    border: 'border-green-500/20 dark:border-green-500/10',
    text: 'text-green-700 dark:text-green-300',
  },
  error: {
    icon: <AlertTriangleIcon className="w-5 h-5" />,
    bg: 'bg-red-500/10 dark:bg-red-500/5',
    border: 'border-red-500/20 dark:border-red-500/10',
    text: 'text-red-700 dark:text-red-400',
  },
  info: {
    icon: <AlertTriangleIcon className="w-5 h-5" />, // Placeholder, can be replaced
    bg: 'bg-blue-500/10 dark:bg-blue-500/5',
    border: 'border-blue-500/20 dark:border-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = toastConfig[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm p-4 rounded-xl border backdrop-blur-lg shadow-2xl ${config.bg} ${config.border} ${config.text}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">{config.icon}</div>
        <div className="flex-grow">
          <p className="text-sm font-semibold">{message}</p>
        </div>
        <button onClick={onClose} className="ml-3 p-1 rounded-full hover:bg-stone-500/10">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;