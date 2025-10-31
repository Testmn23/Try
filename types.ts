/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: 'clothing' | 'accessory';
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

// Fix: Add the missing 'SavedOutfit' interface definition.
export interface SavedOutfit {
  id: string;
  thumbnail: string;
  layers: OutfitLayer[];
}

export interface SavedModel {
  id: string;
  name: string;
  imageUrl: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface DodoWebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      metadata: {
        userId: string;
        creditAmount: string; // metadata values are often strings
      };
      // ... other properties
    }
  }
}