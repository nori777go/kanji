
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_DATA_MAP, getKanjiListForGrade } from '../data/gradeKanji';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-2.5-flash';

// Schema for evaluating handwriting
const handwritingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN, description: "True if the drawing resembles the target kanji" },
    feedback: { type: Type.STRING, description: "Encouraging feedback for a child (Japanese)" },
    confidence: { type: Type.NUMBER, description: "Confidence score 0-100" }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

// Helper to clean Markdown code blocks from JSON response
const cleanJsonText = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
};

/**
 * Fetches details for specific characters.
 * Checks LOCAL data first for ANY grade, then falls back to API.
 */
export const fetchKanjiDetails = async (characters: string[]): Promise<KanjiData[]> => {
    const localResults: KanjiData[] = [];
    const missingChars: string[] = [];

    // 1. Search in ALL local rich data
    characters.forEach(char => {
        let found: KanjiData | undefined;
        // Check all grades for this character
        for (const gradeData of Object.values(GRADE_KANJI_DATA_MAP)) {
            found = gradeData.find(k => k.character === char);
            if (found) break;
        }

        if (found) {
            localResults.push(found);
        } else {
            missingChars.push(char);
        }
    });

    // If we have everything locally, return immediately
    if (missingChars.length === 0) {
        return localResults;
    }

    // 2. Fetch missing characters from API
    try {
        const kanjiListSchema: Schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              character: { type: Type.STRING },
              onyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
              kunyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
              meaning: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["character", "onyomi", "kunyomi", "meaning", "example"]
          }
        };

        const prompt = `
        Provide the reading and meaning data for the following Japanese Kanji characters: ${missingChars.join(', ')}.
        Return a JSON array.
        Meaning should be simple for elementary school students.
        `;
    
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: kanjiListSchema,
            temperature: 0.3, 
          },
        });
    
        if (response.text) {
            const cleanedText = cleanJsonText(response.text);
            const apiResults = JSON.parse(cleanedText) as KanjiData[];
            return [...localResults, ...apiResults];
        }
        
        throw new Error("No data returned");

    } catch (error) {
        console.error("Error fetching kanji details:", error);
        // Fallback for missing ones if API fails
        const fallbacks = missingChars.map(char => ({
            character: char,
            onyomi: [],
            kunyomi: [],
            meaning: "よみこめませんでした",
            example: ""
        }));
        return [...localResults, ...fallbacks];
    }
};

/**
 * Generates a list of Kanji questions.
 * Uses a hybrid approach: Local List + Local Rich Data + API Fill if needed.
 */
export const fetchKanji = async (count: number = 5, excludeChars: string[] = [], grade: number = 1): Promise<KanjiData[]> => {
  // 1. Get the list of characters for this grade (Rich + Simple)
  const fullCharList = getKanjiListForGrade(grade);
  
  if (fullCharList.length > 0) {
      // Filter out excluded characters
      const available = fullCharList.filter(c => !excludeChars.includes(c));
      
      // Shuffle
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const selectedChars = shuffled.slice(0, count);

      // If ran out, fill with randoms
      if (selectedChars.length < count) {
           const remainder = count - selectedChars.length;
           const fillers = fullCharList
              .filter(c => !selectedChars.includes(c))
              .sort(() => 0.5 - Math.random())
              .slice(0, remainder);
           selectedChars.push(...fillers);
      }

      // 2. Fetch details (will use local rich data if available, or API if simple list)
      return fetchKanjiDetails(selectedChars);
  }

  // 3. Fallback: If no list exists for this grade (shouldn't happen for 1-6), ask API to generate
  try {
    const kanjiListSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character: { type: Type.STRING },
          onyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
          kunyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
          meaning: { type: Type.STRING },
          example: { type: Type.STRING }
        },
        required: ["character", "onyomi", "kunyomi", "meaning", "example"]
      }
    };

    let excludePrompt = "";
    if (excludeChars.length > 0) {
        const limitedExclude = excludeChars.slice(-20); 
        excludePrompt = `Do NOT include these characters: ${limitedExclude.join(', ')}.`;
    }

    const prompt = `Generate ${count} distinct Japanese Kanji characters taught in Grade ${grade} of elementary school (小学校${grade}年生). 
    Provide readings and simple meaning appropriate for children.
    ${excludePrompt}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: kanjiListSchema,
        temperature: 0.7, 
      },
    });

    if (response.text) {
        const cleanedText = cleanJsonText(response.text);
        return JSON.parse(cleanedText) as KanjiData[];
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error fetching kanji:", error);
    // Fallback to random Grade 1 data
    const g1 = GRADE_KANJI_DATA_MAP[1];
    const shuffled = [...g1].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

/**
 * Evaluates handwriting.
 * This still uses the API as it requires Vision capabilities.
 */
export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `This is a drawing by a child practicing Kanji. The target character is 「${targetKanji}」.
    Analyze the image. Is the drawing recognizable as ${targetKanji}? 
    Be lenient with stroke order but strict with shape. 
    If it looks mostly correct, say yes.
    Give feedback in simple, polite Japanese for a child.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: handwritingSchema
      }
    });

    if (response.text) {
       try {
        const cleanedText = cleanJsonText(response.text);
        return JSON.parse(cleanedText) as DrawingResult;
      } catch (parseError) {
         console.error("JSON Parse Error:", parseError, "Raw text:", response.text);
         throw new Error("Failed to parse handwriting result");
      }
    }
    throw new Error("No analysis returned");

  } catch (error) {
    console.error("Error evaluating handwriting:", error);
    return {
      isCorrect: true,
      feedback: "じょうずにかけているね！（オフラインモード）",
      confidence: 100
    };
  }
};
