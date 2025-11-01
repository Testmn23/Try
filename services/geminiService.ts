/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from "../types";
import { supabase } from "../lib/supabaseClient";

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

async function callApi(action: string, payload: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // For image generation, userId is crucial for storage path
    if (action !== 'suggestOutfit' && !userId) {
        throw new Error("You must be logged in to perform this action.");
    }
    
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload: { ...payload, userId } }),
    });

    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorResult = await response.json();
            if (errorResult.error) {
                errorMessage = errorResult.error;
            }
        } catch (e) {
            // The response is not JSON, fall back to text.
            const textError = await response.text();
            if (textError) {
                // Check for common server error messages to provide a friendlier notice.
                if (textError.toLowerCase().includes("server error") || textError.toLowerCase().includes("timed out")) {
                    errorMessage = "A server error occurred, possibly due to a timeout. The model generation can sometimes take a while. Please try again.";
                } else {
                    errorMessage = textError.substring(0, 200); // Truncate long HTML errors
                }
            }
        }
        throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
}

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImageDataUrl = await fileToDataUrl(userImage);
    const result = await callApi('generateModelImage', { userImageDataUrl });
    return result.imageUrl;
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File, garmentInfo: WardrobeItem): Promise<string> => {
    const garmentImageDataUrl = await fileToDataUrl(garmentImage);
    const result = await callApi('generateVirtualTryOnImage', { modelImageUrl, garmentImageDataUrl, garmentInfo });
    return result.imageUrl;
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const result = await callApi('generatePoseVariation', { tryOnImageUrl, poseInstruction });
    return result.imageUrl;
};

export const generateImageVariation = async (baseImageUrl: string, prompt: string): Promise<string> => {
    const result = await callApi('generateImageVariation', { baseImageUrl, prompt });
    return result.imageUrl;
}

export const suggestOutfit = async (wardrobe: WardrobeItem[], theme: string): Promise<string[]> => {
    const availableItems = wardrobe.map(item => ({ id: item.id, name: item.name, category: item.category }));
    const result = await callApi('suggestOutfit', { wardrobe: availableItems, theme });
    return result.outfitIds;
}