/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { WardrobeItem } from "../types";

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const imageModel = 'gemini-2.5-flash-image';
const proModel = 'gemini-2.5-pro';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File, garmentInfo: WardrobeItem): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    
    // Use different prompts for clothing vs. accessories
    const prompt = garmentInfo.category === 'clothing'
      ? `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**Crucial Rules:**
1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image.
2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.
3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.
4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.
5.  **Output:** Return ONLY the final, edited image. Do not include any text.`
      : `You are an expert virtual try-on AI for accessories. You will be given a 'model image' and an 'accessory image'. Your task is to create a new photorealistic image where the person from the 'model image' is now wearing the item from the 'accessory image'.

**Crucial Rules:**
1.  **ADD the Accessory:** Realistically place the accessory on the person. It should integrate naturally with their existing outfit and pose (e.g., a necklace should go around their neck, sunglasses on their face).
2.  **Do NOT Replace Clothing:** The person's existing clothing MUST remain unchanged.
3.  **Preserve the Model & Background:** The person's face, hair, body shape, pose, and the background from the 'model image' MUST be perfectly preserved.
4.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
      
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generateImageVariation = async (baseImageUrl: string, prompt: string): Promise<string> => {
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const fullPrompt = `You are an expert photo editing AI. You will be given an image and a text instruction. Your task is to edit the image based on the instruction while maintaining photorealism and the core identity of the subject.
Instruction: "${prompt}".
Key rules:
1.  Apply the change specified in the instruction accurately.
2.  Preserve all other aspects of the image (person's identity, pose, main outfit unless specified) as closely as possible.
3.  Ensure the final image is photorealistic and high quality.
4.  Return ONLY the final, edited image. Do not include any text or commentary.`;

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [baseImagePart, { text: fullPrompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
}

export const suggestOutfit = async (wardrobe: WardrobeItem[], theme: string): Promise<string[]> => {
    const availableItems = wardrobe.map(item => ({ id: item.id, name: item.name, category: item.category }));
    const prompt = `You are an AI fashion stylist. Based on the following list of available wardrobe items, create a stylish and coherent outfit that fits the theme: "${theme}".

Available Items:
${JSON.stringify(availableItems, null, 2)}

Rules:
1.  Choose one 'clothing' item.
2.  Choose up to two 'accessory' items that complement the clothing.
3.  Prioritize creating a complete and fashionable look.
4.  Return ONLY a JSON object with a single key "outfitIds" which is an array of the chosen item IDs.
`;

    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    outfitIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        if (result && Array.isArray(result.outfitIds)) {
            return result.outfitIds;
        }
        throw new Error("Invalid response format from stylist AI.");
    } catch (e) {
        console.error("Failed to parse Style Mixtape response:", response.text);
        throw new Error("The AI stylist had a creative block. Please try a different theme.");
    }
}