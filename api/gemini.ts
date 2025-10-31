/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// @ts-ignore: Deno deploy will provide Buffer
import { Buffer } from 'node:buffer';
import { GoogleGenAI, Modality, Part, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Initialize Gemini API
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash';

// Initialize Supabase Admin Client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables for admin client are not set.");
}
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Helper to parse data URLs
function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid data URL format');
    }
    const mimeType = match[1];
    const base64Data = match[2];
    return { mimeType, base64Data };
}

// Helper to fetch an image from a URL and convert it to a Gemini Part
async function imageUrlToPart(url: string): Promise<Part> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}. Status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    return {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
}

// Helper to upload an image buffer to Supabase Storage
async function uploadImageToSupabase(imageBytes: ArrayBuffer, userId: string, fileName: string): Promise<string> {
    const filePath = `${userId}/${fileName}`;
    const { error } = await supabaseAdmin.storage
        .from('images')
        .upload(filePath, imageBytes, {
            contentType: 'image/png',
            upsert: true,
        });

    if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
    }

    const { data } = supabaseAdmin.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
}

// Main API handler
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { action, payload } = await req.json();

        switch (action) {
            case 'generateModelImage':
                return await handleGenerateModelImage(payload);
            case 'generateVirtualTryOnImage':
                return await handleGenerateVirtualTryOnImage(payload);
            case 'generatePoseVariation':
                return await handleGeneratePoseVariation(payload);
            case 'generateImageVariation':
                return await handleGenerateImageVariation(payload);
            case 'suggestOutfit':
                return await handleSuggestOutfit(payload);
            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
        }
    } catch (error) {
        console.error(`API Error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}


async function handleImageGeneration(promptParts: Part[], userId: string, outputFileName: string) {
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: promptParts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        console.error('Gemini API response dump:', JSON.stringify(response, null, 2));
        throw new Error('Image generation failed: No image data in response from Gemini.');
    }

    const imageBytes = base64ToArrayBuffer(imagePart.inlineData.data);
    const imageUrl = await uploadImageToSupabase(imageBytes, userId, outputFileName);
    
    return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleGenerateModelImage(payload: { userImageDataUrl: string, userId: string }) {
    const { userImageDataUrl, userId } = payload;
    const { mimeType, base64Data } = parseDataUrl(userImageDataUrl);
    const userImagePart: Part = { inlineData: { mimeType, data: base64Data } };
    
    const prompt = `You are an expert AI fashion model generator. Your task is to transform the provided user image into a high-quality, realistic, full-body fashion model photo. **Crucial Rules:** 1. The output MUST be a full-body shot of the person. 2. The person should have a neutral, professional model-like expression and pose. 3. The background MUST be a clean, solid, light gray (#f0f0f0) studio backdrop. 4. The person's original clothing should be replaced with a simple, form-fitting, plain white t-shirt and simple blue jeans. 5. Retain the person's physical characteristics (face, hair, body shape) as accurately as possible. 6. The final image should be photorealistic and high-resolution. Return ONLY the final image.`;
    const textPart: Part = { text: prompt };

    return await handleImageGeneration([userImagePart, textPart], userId, `model-${Date.now()}.png`);
}

async function handleGenerateVirtualTryOnImage(payload: { modelImageUrl: string, garmentImageDataUrl: string, garmentInfo: { name: string }, userId: string }) {
    const { modelImageUrl, garmentImageDataUrl, garmentInfo, userId } = payload;

    const modelImagePart = await imageUrlToPart(modelImageUrl);
    const { mimeType, base64Data } = parseDataUrl(garmentImageDataUrl);
    const garmentImagePart: Part = { inlineData: { mimeType, data: base64Data } };

    const prompt = `You are an expert AI virtual try-on stylist. Your task is to realistically apply the provided garment image onto the person in the base model image. **Crucial Rules:** 1. The garment is a ${garmentInfo.name}. 2. Preserve the model's pose, body shape, and facial features. 3. The garment should fit naturally, with realistic lighting, shadows, and fabric draping that matches the model's pose. 4. Do not change the background. 5. Return ONLY the final, photorealistic image.`;
    const textPart: Part = { text: prompt };

    return await handleImageGeneration([modelImagePart, garmentImagePart, textPart], userId, `try-on-${Date.now()}.png`);
}

async function handleGeneratePoseVariation(payload: { tryOnImageUrl: string, poseInstruction: string, userId: string }) {
    const { tryOnImageUrl, poseInstruction, userId } = payload;

    const baseImagePart = await imageUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert AI fashion photographer. Your task is to recreate the image of the person with their current outfit, but in a new pose. **Crucial Rules:** 1. The new pose is: "${poseInstruction}". 2. The person's appearance, clothing, and the background MUST remain identical. 3. The new pose should look natural and photorealistic. 4. The lighting and shadows must be adjusted realistically for the new pose. Return ONLY the final image.`;
    const textPart: Part = { text: prompt };

    return await handleImageGeneration([baseImagePart, textPart], userId, `pose-${Date.now()}.png`);
}

async function handleGenerateImageVariation(payload: { baseImageUrl: string, prompt: string, userId: string }) {
    const { baseImageUrl, prompt, userId } = payload;
    const baseImagePart = await imageUrlToPart(baseImageUrl);
    const textPart: Part = { text: prompt };

    return await handleImageGeneration([baseImagePart, textPart], userId, `variation-${Date.now()}.png`);
}

async function handleSuggestOutfit(payload: { wardrobe: { id: string, name: string, category: string }[], theme: string }) {
    const { wardrobe, theme } = payload;

    const wardrobeList = wardrobe.map(item => `- ID: "${item.id}", Name: "${item.name}", Category: "${item.category}"`).join('\n');
    const prompt = `You are a fashion stylist AI. Your goal is to create a coherent and stylish outfit from a list of available wardrobe items based on a specific theme.

**Theme:** "${theme}"

**Available Wardrobe Items:**
${wardrobeList}

**Instructions:**
1. Analyze the theme and the available items.
2. Select a combination of items that creates a complete and fashionable outfit for the theme.
3. Your primary goal is to return a JSON object containing a single key "outfitIds", which is an array of the item IDs for the selected outfit. For example: {"outfitIds": ["item-id-1", "item-id-2"]}.
4. Prioritize creating a logical outfit. If you cannot form a complete outfit, return the best combination possible. If no items fit the theme, return an empty array for "outfitIds".
5. Do not include items that would clash.
6. Return ONLY the JSON object. Do not include any other text, explanation, or markdown formatting.`;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    outfitIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['outfitIds']
            }
        }
    });

    const jsonText = response.text.trim();
    const sanitizedJson = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    const jsonResponse = JSON.parse(sanitizedJson);
    const outfitIds = jsonResponse.outfitIds || [];

    return new Response(JSON.stringify({ outfitIds }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
