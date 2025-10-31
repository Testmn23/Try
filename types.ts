/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Represents a single clothing item in the user's wardrobe.
export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory' | 'dress' | 'clothing';
}

// Represents a layer in the outfit stack, which can be the base model or a garment.
export interface OutfitLayer {
  garment?: WardrobeItem;
  imageUrl: string;
}

// Represents a user-saved model.
export interface SavedModel {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  created_at: string;
}

// Represents a user-saved complete outfit.
export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string;
  layers: OutfitLayer[];
  created_at: string;
}

// Defines the available theme options for the UI.
export type Theme = 'light' | 'dark' | 'system';

// Type definition for the payload received from Dodo Payments webhook.
export interface DodoWebhookPayload {
  type: string;
  data: {
    object: {
      metadata: {
        userId: string;
        creditAmount: string;
      };
    };
  };
}
