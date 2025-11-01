/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from './icons';
import ImageCropModal from './ImageCropModal';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  credits: number;
  onDeleteItem: (id: string) => void;
}

type Category = 'clothing' | 'accessory';

const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe, credits, onDeleteItem }) => {
    const [error, setError] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('clothing');
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const filteredWardrobe = useMemo(() => wardrobe.filter(item => item.category === activeCategory), [wardrobe, activeCategory]);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1); // -1 for precision
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', checkScrollability);
            window.addEventListener('resize', checkScrollability);
            return () => {
                el.removeEventListener('scroll', checkScrollability);
                window.removeEventListener('resize', checkScrollability);
            };
        }
    }, [checkScrollability, filteredWardrobe]);


    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8;
            el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            setOriginalFile(file);
            setImageToCrop(URL.createObjectURL(file));
            setIsCropModalOpen(true);
        }
    };

    const handleCropConfirm = (croppedFile: File) => {
        const customGarmentInfo: WardrobeItem = {
            id: `custom-${Date.now()}`,
            name: originalFile?.name || 'Custom Garment',
            url: URL.createObjectURL(croppedFile),
            category: activeCategory,
        };
        onGarmentSelect(croppedFile, customGarmentInfo);
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setOriginalFile(null);
    };

    const handleSkipCrop = () => {
        if (!originalFile) return;
        const customGarmentInfo: WardrobeItem = {
            id: `custom-${Date.now()}`,
            name: originalFile.name,
            url: URL.createObjectURL(originalFile),
            category: activeCategory,
        };
        onGarmentSelect(originalFile, customGarmentInfo);
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setOriginalFile(null);
    }

    const handleCropCancel = () => {
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setOriginalFile(null);
    }

  return (
    <>
    <div className="pt-6 border-t border-stone-400/50 dark:border-stone-600/50">
        <h2 className="text-xl font-playfair font-bold text-stone-800 dark:text-stone-200 mb-3">Wardrobe</h2>
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 mb-3">
            <button 
                onClick={() => setActiveCategory('clothing')} 
                className={`px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === 'clothing' ? 'text-fuchsia-500 border-b-2 border-fuchsia-500' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
            >
                Clothing
            </button>
             <button 
                onClick={() => setActiveCategory('accessory')} 
                className={`px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === 'accessory' ? 'text-fuchsia-500 border-b-2 border-fuchsia-500' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
            >
                Accessories
            </button>
        </div>
        <div className="relative">
            {canScrollLeft && (
                <button 
                    onClick={() => handleScroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-stone-300 dark:border-stone-700 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label="Scroll left"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
            )}
            <div 
                ref={scrollContainerRef}
                className="flex items-center gap-3 overflow-x-auto pb-2 -mb-2"
                // Fix: Use camelCase for CSS properties in React style objects.
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
                {filteredWardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                const isCustom = item.id.startsWith('custom-');
                return (
                    <div key={item.id} className="relative group">
                        <button
                            onClick={() => handleGarmentClick(item)}
                            disabled={isLoading || isActive || credits <= 0}
                            className="flex-shrink-0 w-24 h-24 relative aspect-square border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            aria-label={`Select ${item.name}`}
                        >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                            </div>
                            {isActive && (
                                <div className="absolute inset-0 bg-stone-900/70 dark:bg-stone-950/70 border-2 border-fuchsia-500 rounded-lg flex items-center justify-center">
                                    <CheckCircleIcon className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </button>
                        {isCustom && !isActive && (
                            <button 
                                onClick={() => onDeleteItem(item.id)}
                                className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                                aria-label={`Delete ${item.name}`}
                            >
                                <Trash2Icon className="w-3 h-3"/>
                            </button>
                        )}
                    </div>
                );
                })}
                <label htmlFor="custom-garment-upload" className={`flex-shrink-0 w-24 h-24 relative aspect-square border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 transition-colors ${isLoading || credits <= 0 ? 'cursor-not-allowed bg-stone-100 dark:bg-stone-900' : 'hover:border-fuchsia-500 hover:text-fuchsia-500 cursor-pointer'}`}>
                    <UploadCloudIcon className="w-6 h-6 mb-1"/>
                    <span className="text-xs text-center">Upload</span>
                    <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading || credits <= 0}/>
                </label>
            </div>
             {canScrollRight && (
                <button 
                    onClick={() => handleScroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-stone-300 dark:border-stone-700 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label="Scroll right"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            )}
        </div>

        {filteredWardrobe.length === 0 && (
             <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">No {activeCategory} items yet. Try uploading one!</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
    {imageToCrop && (
        <ImageCropModal
            isOpen={isCropModalOpen}
            imageSrc={imageToCrop}
            onClose={handleCropCancel}
            onConfirm={handleCropConfirm}
            onSkip={handleSkipCrop}
            originalFileName={originalFile?.name || 'cropped-image.png'}
        />
    )}
    </>
  );
};

export default WardrobePanel;