/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from "./types";

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

async function callApi(action: string, payload: any) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `API call for action '${action}' failed.`);
    }
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
