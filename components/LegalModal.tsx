/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './icons';

interface LegalModalProps {
  contentKey: string | null;
  onClose: () => void;
}

const legalContent: Record<string, { title: string; content: React.ReactNode }> = {
  terms: {
    title: 'Terms of Service',
    content: (
      <div className="space-y-4 text-sm">
        <p>Welcome to our application. These terms and conditions outline the rules and regulations for the use of our application.</p>
        <p>By accessing this application we assume you accept these terms and conditions. Do not continue to use this application if you do not agree to all of the terms and conditions stated on this page.</p>
        <h3 className="font-bold pt-2">Intellectual Property Rights</h3>
        <p>Unless otherwise stated, we and/or our licensors own the intellectual property rights for all material on this application. All intellectual property rights are reserved. You may access this from our application for your own personal use subjected to restrictions set in these terms and conditions.</p>
        <p>This is a placeholder document. You must replace this with your own Terms of Service.</p>
      </div>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
       <div className="space-y-4 text-sm">
        <p>Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our application.</p>
        <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
        <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
        <p>This is a placeholder document. You must replace this with your own Privacy Policy.</p>
      </div>
    ),
  },
};

const LegalModal: React.FC<LegalModalProps> = ({ contentKey, onClose }) => {
  const content = contentKey ? legalContent[contentKey] : null;

  return (
    <AnimatePresence>
      {content && (
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
            className="relative bg-stone-50 dark:bg-stone-950 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
              <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200">{content.title}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-stone-600 dark:text-stone-400 overflow-y-auto">
              {content.content}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;