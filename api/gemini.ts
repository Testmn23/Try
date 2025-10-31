/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

// --- CONFIGURATION ---
// Determines which backend to use. Defaults to true.
// Set USE_OPENROUTER=false in your environment to use the direct Google GenAI API.
const USE_OPENROUTER = process.env.USE_OPENROUTER ? process.env.USE_OPENROUTER === 'true' : true;

const GOOGLE_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GOOGLE_PRO_MODEL = 'gemini-2.5-pro';

const OPENROUTER_IMAGE_MODEL = 'google/gemini-2.5-flash-image-preview';
const OPENROUTER_PRO_MODEL = 'google/gemini-2.5-pro';


// --- Vercel Edge Function Handler ---

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { action, payload } = await req.json();

    let result: any;
    if (USE_OPENROUTER) {
      result = await handleOpenRouterRequest(action, payload, req);
    } else {
      result = await handleGoogleAIRequest(action, payload);
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// =================================================================
// --- GOOGLE AI SDK IMPLEMENTATION (when USE_OPENROUTER is false) ---
// =================================================================

let _ai: GoogleGenAI;
const getAiClient = () => {
    if (!_ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set on the server.");
        }
        _ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return _ai;
};

const dataUrlToPart = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { inlineData: { mimeType: mimeMatch[1], data: arr[1] } };
}

const handleGoogleApiResponse = (response: GenerateContentResponse): string => {
    // ... (rest of the function is the same as before)
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }
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

async function handleGoogleAIRequest(action: string, payload: any) {
    const ai = getAiClient();
    let response: GenerateContentResponse;

    switch (action) {
        case 'generateModelImage': {
            const { userImageDataUrl } = payload;
            const userImagePart = dataUrlToPart(userImageDataUrl);
            const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
            response = await ai.models.generateContent({
                model: GOOGLE_IMAGE_MODEL,
                contents: { parts: [userImagePart, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            return { imageUrl: handleGoogleApiResponse(response) };
        }

        case 'generateVirtualTryOnImage': {
            const { modelImageUrl, garmentImageDataUrl, garmentInfo } = payload;
            const modelImagePart = dataUrlToPart(modelImageUrl);
            const garmentImagePart = dataUrlToPart(garmentImageDataUrl);
            const prompt = garmentInfo.category === 'clothing' ? /* clothing prompt */ `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.\n\n**Crucial Rules:**\n1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image.\n2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.\n3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.\n4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.\n5.  **Output:** Return ONLY the final, edited image. Do not include any text.` : /* accessory prompt */ `You are an expert virtual try-on AI for accessories. You will be given a 'model image' and an 'accessory image'. Your task is to create a new photorealistic image where the person from the 'model image' is now wearing the item from the 'accessory image'.\n\n**Crucial Rules:**\n1.  **ADD the Accessory:** Realistically place the accessory on the person. It should integrate naturally with their existing outfit and pose (e.g., a necklace should go around their neck, sunglasses on their face).\n2.  **Do NOT Replace Clothing:** The person's existing clothing MUST remain unchanged.\n3.  **Preserve the Model & Background:** The person's face, hair, body shape, pose, and the background from the 'model image' MUST be perfectly preserved.\n4.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
            response = await ai.models.generateContent({
                model: GOOGLE_IMAGE_MODEL,
                contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            return { imageUrl: handleGoogleApiResponse(response) };
        }

        case 'generatePoseVariation': {
            const { tryOnImageUrl, poseInstruction } = payload;
            const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
            const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
            response = await ai.models.generateContent({
                model: GOOGLE_IMAGE_MODEL,
                contents: { parts: [tryOnImagePart, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            return { imageUrl: handleGoogleApiResponse(response) };
        }

        case 'generateImageVariation': {
            const { baseImageUrl, prompt } = payload;
            const baseImagePart = dataUrlToPart(baseImageUrl);
            const fullPrompt = `You are an expert photo editing AI. You will be given an image and a text instruction. Your task is to edit the image based on the instruction while maintaining photorealism and the core identity of the subject.\nInstruction: "${prompt}".\nKey rules:\n1.  Apply the change specified in the instruction accurately.\n2.  Preserve all other aspects of the image (person's identity, pose, main outfit unless specified) as closely as possible.\n3.  Ensure the final image is photorealistic and high quality.\n4.  Return ONLY the final, edited image. Do not include any text or commentary.`;
            response = await ai.models.generateContent({
                model: GOOGLE_IMAGE_MODEL,
                contents: { parts: [baseImagePart, { text: fullPrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            return { imageUrl: handleGoogleApiResponse(response) };
        }

        case 'suggestOutfit': {
            const { wardrobe, theme } = payload;
            const prompt = `You are an AI fashion stylist. Based on the following list of available wardrobe items, create a stylish and coherent outfit that fits the theme: "${theme}".\n\nAvailable Items:\n${JSON.stringify(wardrobe, null, 2)}\n\nRules:\n1.  Choose one 'clothing' item.\n2.  Choose up to two 'accessory' items that complement the clothing.\n3.  Prioritize creating a complete and fashionable look.\n4.  Return ONLY a JSON object with a single key "outfitIds" which is an array of the chosen item IDs.`;
            response = await ai.models.generateContent({
                model: GOOGLE_PRO_MODEL,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            outfitIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            const text = response.text;
            if (!text) {
                throw new Error("The AI model did not return any text for the outfit suggestion.");
            }
            const jsonResult = JSON.parse(text.trim());
            return { outfitIds: jsonResult.outfitIds };
        }

        default:
            throw new Error(`Invalid action: ${action}`);
    }
}


// =====================================================================
// --- OPENROUTER IMPLEMENTATION (when USE_OPENROUTER is true) ---
// =====================================================================

const handleOpenRouterImageResponse = (data: any): string => {
    const content = data.choices?.[0]?.message?.content;
    if (!Array.isArray(content)) {
        // Temporarily include the full response in the error for debugging.
        const fullResponseString = JSON.stringify(data, null, 2);
        console.error("OpenRouter did not return a valid content array. Full response:", fullResponseString);
        throw new Error(`OpenRouter response did not contain a valid content array. Full response: ${fullResponseString}`);
    }

    // OpenRouter uses a different response format for image data
    const imagePart = content.find(part => part.type === 'image' && part.source?.type === 'base64');
    
    if (imagePart?.source) {
        const { media_type, data } = imagePart.source;
        return `data:${media_type};base64,${data}`;
    }

    const textPart = content.find(part => part.type === 'text');
    const modelError = data.error?.message;
    const errorMessage = `OpenRouter did not return an image. ` +
      (modelError ? `Error: ${modelError}` : '') +
      (textPart ? ` It responded with: "${textPart.text}"` : "");
    throw new Error(errorMessage);
};

async function callOpenRouter(model: string, messages: any[], req: Request, isJsonMode: boolean = false) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable not set.");
    }

    const body: any = { model, messages };
    if (isJsonMode) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": req.headers.get('origin') || 'http://localhost:3000',
            "X-Title": "Fit Check"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
}

async function handleOpenRouterRequest(action: string, payload: any, req: Request) {

    switch (action) {
        case 'generateModelImage': {
            const { userImageDataUrl } = payload;
            const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
            const messages = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: userImageDataUrl } }] }];
            const data = await callOpenRouter(OPENROUTER_IMAGE_MODEL, messages, req);
            return { imageUrl: handleOpenRouterImageResponse(data) };
        }

        case 'generateVirtualTryOnImage': {
            const { modelImageUrl, garmentImageDataUrl, garmentInfo } = payload;
            const prompt = garmentInfo.category === 'clothing' ? /* clothing prompt */ `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.\n\n**Crucial Rules:**\n1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image.\n2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.\n3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.\n4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.\n5.  **Output:** Return ONLY the final, edited image. Do not include any text.` : /* accessory prompt */ `You are an expert virtual try-on AI for accessories. You will be given a 'model image' and an 'accessory image'. Your task is to create a new photorealistic image where the person from the 'model image' is now wearing the item from the 'accessory image'.\n\n**Crucial Rules:**\n1.  **ADD the Accessory:** Realistically place the accessory on the person. It should integrate naturally with their existing outfit and pose (e.g., a necklace should go around their neck, sunglasses on their face).\n2.  **Do NOT Replace Clothing:** The person's existing clothing MUST remain unchanged.\n3.  **Preserve the Model & Background:** The person's face, hair, body shape, pose, and the background from the 'model image' MUST be perfectly preserved.\n4.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
            const messages = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: modelImageUrl } }, { type: "image_url", image_url: { url: garmentImageDataUrl } }] }];
            const data = await callOpenRouter(OPENROUTER_IMAGE_MODEL, messages, req);
            return { imageUrl: handleOpenRouterImageResponse(data) };
        }

        case 'generatePoseVariation': {
            const { tryOnImageUrl, poseInstruction } = payload;
            const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
            const messages = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: tryOnImageUrl } }] }];
            const data = await callOpenRouter(OPENROUTER_IMAGE_MODEL, messages, req);
            return { imageUrl: handleOpenRouterImageResponse(data) };
        }

        case 'generateImageVariation': {
            const { baseImageUrl, prompt } = payload;
            const fullPrompt = `You are an expert photo editing AI. You will be given an image and a text instruction. Your task is to edit the image based on the instruction while maintaining photorealism and the core identity of the subject.\nInstruction: "${prompt}".\nKey rules:\n1.  Apply the change specified in the instruction accurately.\n2.  Preserve all other aspects of the image (person's identity, pose, main outfit unless specified) as closely as possible.\n3.  Ensure the final image is photorealistic and high quality.\n4.  Return ONLY the final, edited image. Do not include any text or commentary.`;
            const messages = [{ role: "user", content: [{ type: "text", text: fullPrompt }, { type: "image_url", image_url: { url: baseImageUrl } }] }];
            const data = await callOpenRouter(OPENROUTER_IMAGE_MODEL, messages, req);
            return { imageUrl: handleOpenRouterImageResponse(data) };
        }

        case 'suggestOutfit': {
            const { wardrobe, theme } = payload;
            const prompt = `You are an AI fashion stylist. Based on the following list of available wardrobe items, create a stylish and coherent outfit that fits the theme: "${theme}".\n\nAvailable Items:\n${JSON.stringify(wardrobe, null, 2)}\n\nRules:\n1.  Choose one 'clothing' item.\n2.  Choose up to two 'accessory' items that complement the clothing.\n3.  Prioritize creating a complete and fashionable look.\n4.  Return ONLY a JSON object with a single key "outfitIds" which is an array of the chosen item IDs.`;
            const messages = [{ role: "user", content: prompt }];
            const data = await callOpenRouter(OPENROUTER_PRO_MODEL, messages, req, true);
            const jsonResult = JSON.parse(data.choices[0].message.content);
            return { outfitIds: jsonResult.outfitIds };
        }

        default:
            throw new Error(`Invalid action: ${action}`);
    }
}