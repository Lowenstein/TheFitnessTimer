import { GoogleGenAI, Type } from "@google/genai";
import { IntervalItem, IntervalType } from '../types';
import { v4 as uuidv4 } from 'uuid'; // We will simulate uuid since we don't have the lib, handled in helper

// Mocking UUID since we can't easily import crypto.randomUUID in all envs or external libs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateWorkoutRoutine = async (prompt: string): Promise<IntervalItem[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a professional fitness coach. 
    Create a HIIT or Interval workout based on the user's request.
    Return the result strictly as a JSON array of intervals.
    
    Interval types allowed: WORK, REST, PREP, COOLDOWN.
    Colors should be appropriate hex codes (Green for work, Red for rest, Yellow for prep, Blue for cooldown).
    Duration is in seconds.
    Keep descriptions short (1-3 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a workout routine for: ${prompt}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['WORK', 'REST', 'PREP', 'COOLDOWN'] },
              duration: { type: Type.INTEGER, description: "Duration in seconds" },
              name: { type: Type.STRING, description: "Short name of the exercise" },
            },
            required: ['type', 'duration', 'name']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawData = JSON.parse(text);

    // Map the raw data to our internal structure with IDs and Colors
    return rawData.map((item: any) => {
        let color = '#22c55e';
        if (item.type === 'REST') color = '#ef4444';
        if (item.type === 'PREP') color = '#eab308';
        if (item.type === 'COOLDOWN') color = '#3b82f6';

        return {
            id: generateId(),
            type: item.type as IntervalType,
            duration: item.duration,
            name: item.name,
            color: color
        };
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};