/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted for easy access
export const defaultWardrobe: WardrobeItem[] = [
  // Clothing
  {
    id: 'gemini-sweat',
    name: 'Gemini Sweat',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/gemini-sweat-2.png',
    category: 'clothing',
  },
  {
    id: 'gemini-tee',
    name: 'Gemini Tee',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/Gemini-tee.png',
    category: 'clothing',
  },
  // Accessories
  {
    id: 'aviator-sunglasses',
    name: 'Aviators',
    url: 'https://raw.githubusercontent.com/google-gemini-api/app-images/main/try-on/accessories/aviator-sunglasses.png',
    category: 'accessory',
  },
  {
    id: 'beanie-hat',
    name: 'Beanie Hat',
    url: 'https://raw.githubusercontent.com/google-gemini-api/app-images/main/try-on/accessories/beanie-hat.png',
    category: 'accessory',
  },
  {
    id: 'gold-necklace',
    name: 'Gold Necklace',
    url: 'https://raw.githubusercontent.com/google-gemini-api/app-images/main/try-on/accessories/gold-necklace.png',
    category: 'accessory',
  },
];