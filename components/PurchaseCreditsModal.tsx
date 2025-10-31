/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CreditIcon } from './icons';
import Spinner from './Spinner';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (creditAmount: number) => void;
  isLoading: boolean;
}

const creditPackages = [
  { amount: 10, price: 2, name: 'Starter Pack', description: 'Perfect for trying things out.', popular: false },
  { amount: 50, price: 8, name: 'Creator Pack', description: 'Save 20% and style more.', popular: true },
  { amount: 100, price: 15, name: 'Pro Pack', description: 'Best value for power users.', popular: false },
];

const PurchaseCreditsModal: React.FC<PurchaseCreditsModalProps> = ({ isOpen, onClose, onPurchase, isLoading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative bg-stone-50 dark:bg-stone-950 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
                <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200">Get More Credits</h2>
                <button onClick={onClose} className="p-1 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
              <div className="grid md:grid-cols-3 gap-4">
                {creditPackages.map(pkg => (
                  <div 
                    key={pkg.amount} 
                    className={`relative flex flex-col p-6 rounded-xl border-2 transition-all duration-300 ${pkg.popular ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50'}`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-4 -translate-y-1/2 bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </div>
                    )}
                    <div className="flex-grow">
                      <h3 className="text-lg font-sora font-semibold text-stone-800 dark:text-stone-200">{pkg.name}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{pkg.description}</p>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-bold font-sora text-stone-900 dark:text-stone-100">{pkg.amount}</span>
                        <span className="text-stone-600 dark:text-stone-300">Credits</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onPurchase(pkg.amount)} 
                      disabled={isLoading}
                      className={`w-full mt-6 flex items-center justify-center text-center font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out active:scale-95 text-base disabled:opacity-50 disabled:cursor-wait ${pkg.popular ? 'bg-fuchsia-500 text-white hover:bg-fuchsia-600' : 'bg-stone-800 text-white hover:bg-stone-600'}`}
                    >
                      {isLoading ? (
                        <Spinner />
                      ) : (
                        <>
                          <CreditIcon className="w-5 h-5 mr-2" />
                          {`Purchase for $${pkg.price.toFixed(2)}`}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
             <div className="text-center p-4 border-t border-stone-200 dark:border-stone-800 flex-shrink-0">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    Secure payments processed by Dodo Payments.
                </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseCreditsModal;