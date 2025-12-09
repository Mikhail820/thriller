
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client. 
// Note: API key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export const generateText = async (
  prompt: string,
  model: string = 'gemini-2.5-flash',
  systemInstruction?: string,
  temperature: number = 0.7
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        // Removed maxOutputTokens as per guidelines to avoid conflict with thinking tokens or limiting output unnecessarily
      },
    });

    if (response.text) {
      return response.text;
    }
    return "Error: No text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `System Failure: ${formatError(error)}`;
  }
};

export const generateStream = async (
  prompt: string,
  onChunk: (text: string) => void,
  model: string = 'gemini-2.5-flash',
  systemInstruction?: string
): Promise<void> => {
  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        // Removed maxOutputTokens
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    onChunk(`\n[CONNECTION LOST: ${formatError(error)}]`);
  }
};

export const generateStyleSuggestion = async (
  protagonist: string,
  antagonist: string,
  setting: string,
  tone: string,
  languageInstruction: string
): Promise<string> => {
  const prompt = `Analyze these story parameters:
  Protagonist: ${protagonist}
  Antagonist: ${antagonist}
  Setting: ${setting}
  Tone: ${tone}

  Suggest a specific "Author Protocol" (writing style description). 
  Example: "Stephen King mixed with Tom Clancy, heavy on technical details but psychological horror atmosphere."
  Keep it under 20 words.
  ${languageInstruction}`;

  return await generateText(prompt, 'gemini-2.5-flash', "You are a literary analyst.");
};

export const generateStoryElement = async (
  targetField: string,
  context: Record<string, string>,
  languageInstruction: string
): Promise<string> => {
  const prompt = `
  You are a creative writing assistant.
  Task: Generate a creative, unique, and fitting concept for the field: "${targetField}".
  
  CURRENT CONTEXT (Use this to match the vibe):
  Title/Codename: ${context.title || 'Unknown'}
  Protagonist: ${context.protagonist || 'Unknown'}
  Antagonist: ${context.antagonist || 'Unknown'}
  Setting: ${context.setting || 'Unknown'}
  Tone: ${context.tone || 'Unknown'}

  Requirements:
  - Output ONLY the content for "${targetField}".
  - Keep it short, punchy, and evocative (max 10-15 words).
  - Do not write "Here is a suggestion". Just the text.
  ${languageInstruction}
  `;

  return await generateText(prompt, 'gemini-2.5-flash', "You are an expert thriller writer.");
};

export const parseOutline = (rawText: string): { title: string; summary: string }[] => {
  // Rough heuristic to parse the outline generation into chapters
  const lines = rawText.split('\n');
  const chapters: { title: string; summary: string }[] = [];
  
  let currentTitle = "";
  let currentSummaryParts: string[] = [];

  // Supports Chapter, Глава (Russian), Часть (Part/Russian)
  const chapterRegex = /^(Chapter|Глава|Часть)\s+\d+/i;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (chapterRegex.test(trimmed)) {
      // Save previous
      if (currentTitle) {
        chapters.push({ title: currentTitle, summary: currentSummaryParts.join(' ') });
      }
      currentTitle = trimmed;
      currentSummaryParts = [];
    } else {
      if (currentTitle) {
        currentSummaryParts.push(trimmed);
      }
    }
  });

  // Push last
  if (currentTitle) {
    chapters.push({ title: currentTitle, summary: currentSummaryParts.join(' ') });
  }

  return chapters;
};
