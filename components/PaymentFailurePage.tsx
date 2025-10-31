/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangleIcon } from './icons';

interface PaymentFailurePageProps {
  onContinue: () => void;
  onTryAgain: () => void;
}

const PaymentFailurePage: React.FC<PaymentFailurePageProps> = ({ onContinue, onTryAgain }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-screen h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-4"
    >
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <AlertTriangleIcon className="w-24 h-24 text-red-500" />
        </motion.div>
        <h1 className="mt-6 text-4xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
          Payment Canceled
        </h1>
        <p className="mt-4 text-lg font-sora text-stone-600 dark:text-stone-400">
          It looks like the payment process wasn't completed. Your card has not been charged.
        </p>
        <div className="mt-8 w-full flex flex-col sm:flex-row items-center gap-4">
            <button
            onClick={onContinue}
            className="w-full sm:w-1/2 flex items-center justify-center px-8 py-3 text-base font-semibold text-stone-700 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 rounded-md cursor-pointer hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
             Return to App
            </button>
            <button
            onClick={onTryAgain}
            className="w-full sm:w-1/2 flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-fuchsia-500 rounded-md cursor-pointer hover:bg-fuchsia-600 transition-colors"
            >
            Try Again
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentFailurePage;