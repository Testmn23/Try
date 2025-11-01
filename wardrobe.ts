/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';
import { buildAbsoluteUrl } from './lib/utils';

// Default wardrobe items hosted for easy access
export const defaultWardrobe: WardrobeItem[] = [
  {
    id: 'dark-blue-formal-shirt',
    name: 'Dark Blue Formal',
    url: buildAbsoluteUrl('/shirt_1.png'),
    category: 'clothing',
  },
  {
    id: 'light-blue-casual-shirt',
    name: 'Light Blue Casual',
    url: buildAbsoluteUrl('/shirt_2.png'),
    category: 'clothing',
  },
  {
    id: 'black-hello-tshirt',
    name: 'Hello T-Shirt',
    url: buildAbsoluteUrl('/shirt_3.png'),
    category: 'clothing',
  },
];
