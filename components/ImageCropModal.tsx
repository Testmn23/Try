/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { XIcon } from './icons';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
  onSkip: () => void;
  imageSrc: string;
  originalFileName: string;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  imageSrc,
  originalFileName
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Aspect ratio 1:1, can be changed
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleConfirm = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileType = blob.type || 'image/png';
      const croppedFile = new File([blob], originalFileName, { type: fileType });
      onConfirm(croppedFile);
    }, 'image/png', 1);
  };

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
            className="relative bg-stone-50 dark:bg-stone-950 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
                <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200">Crop Garment</h2>
                <button onClick={onClose} className="p-1 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
                minHeight={100}
              >
                <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Garment to crop" className="w-full h-auto max-h-[60vh] object-contain" />
              </ReactCrop>
            </div>

            <div className="flex items-center justify-end gap-4 p-4 border-t border-stone-200 dark:border-stone-800 flex-shrink-0">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 text-base font-semibold text-stone-700 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 rounded-md cursor-pointer hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onSkip}
                    className="px-6 py-2 text-base font-semibold text-stone-700 dark:text-stone-300 hover:underline"
                >
                    Use Original
                </button>
                 <button 
                    onClick={handleConfirm}
                    className="px-6 py-2 text-base font-semibold text-white bg-fuchsia-500 rounded-md cursor-pointer hover:bg-fuchsia-600 transition-colors"
                >
                    Confirm & Apply
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropModal;