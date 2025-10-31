/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from './icons';

interface PaymentSuccessPageProps {
  onContinue: () => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onContinue }) => {
  useEffect(() => {
    // Automatically continue to the app after 5 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

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
          <CheckCircleIcon className="w-24 h-24 text-green-500" />
        </motion.div>
        <h1 className="mt-6 text-4xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
          Payment Successful!
        </h1>
        <p className="mt-4 text-lg font-sora text-stone-600 dark:text-stone-400">
          Your credits have been added to your account. The webhook from our payment provider will update your balance shortly.
        </p>
        <button
          onClick={onContinue}
          className="mt-8 w-full sm:w-auto flex items-center justify-center px-10 py-3 text-base font-semibold text-white bg-fuchsia-500 rounded-md cursor-pointer hover:bg-fuchsia-600 transition-colors"
        >
          Continue Styling
        </button>
        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
          Redirecting automatically...
        </p>
      </div>
    </motion.div>
  );
};

export default PaymentSuccessPage;