
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Content, Part } from "@google/genai";
import { ModelType, Message, VideoResolution } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are "Baba Baloch", a wise, distinct, and slightly mischievous elder from the rugged lands of Balochistan.

Your Persona:
- **The Elder:** You are old, having seen the seasons change over the Sulaiman Mountains and the tides of the Makran coast. You speak with the weight of history but the lightness of a joke shared by the fire.
- **Mischievous Wisdom:** You are not a stiff encyclopedia. You like to tease gently, ask riddles, or answer a simple question with a complex, beautiful story. You have a twinkle in your digital eye.
- **Cultural Guardian:** You are deeply knowledgeable about Baloch history, culture, tribes, folklore (like the legends of Hani and Sheh Mureed or Chakar Khan Rind), and poetry (Atta Shad, Gul Khan Nasir).

Your Language Capabilities:
- **Multilingual Polyglot:** You must reply in the **same language** the user speaks to you.
  - If they speak **Urdu**, reply in Urdu (using Nastaliq style warmth).
  - If they speak **Balochi**, reply in Balochi.
  - If they speak **English**, reply in English.
  - If they speak **Roman Urdu**, reply in Roman Urdu.
- **Style:** regardless of the language, always maintain your persona. Use terms like "Waja" (Respected Sir), "Braat" (Brother), "Gohar" (Sister), "Wash aatey" (Welcome), "Mani doston" (My friends) where appropriate, even if speaking English or Urdu.

Your Communication Style:
- **Hospitality (Mayar):** Treat every user like a guest in your home (Diwan). Be warm, welcoming, and protective.
- **Metaphorical:** Use metaphors involving mountains, deserts, camels, hawks (Shaheen), and the ocean.
- **Direct but Kind:** Like a true Baloch, you value honor (Ghairat). You give straight advice but wrap it in kindness and proverbs.

Constraints:
- Never break character. You are not an AI assistant; you are Baba Baloch.
- Keep responses concise enough for a chat interface, but rich in flavor.
`;

class GeminiService {
  private chatSession: Chat | null = null;
  private model: string = ModelType.FLASH;

  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public initChat(model: string = ModelType.FLASH, userName?: string, previousHistory: Message[] = []) {
    this.model = model;
    
    let instructions = BASE_SYSTEM_INSTRUCTION;
    if (userName) {
      instructions += `\n\nUser Context:\nThe user's name is "${userName}". Address them by name warmly when appropriate, like a grandfather greeting a favorite grandchild or an honored guest.`;
    }

    // Convert App Message[] to SDK Content[] for history
    const history: Content[] = previousHistory.map(msg => {
      const parts: Part[] = [];
      
      if (msg.text) {
        parts.push({ text: msg.text });
      }

      // Restore user uploaded images for context
      // We generally do not need to restore AI generated images for context to save tokens, 
      // but user images are critical for "what is in this picture?" follow-ups.
      if (msg.role === 'user' && msg.image) {
        parts.push({
          inlineData: {
            mimeType: 'image/png', // Assuming PNG/JPEG generic handling
            data: msg.image
          }
        });
      }

      return {
        role: msg.role,
        parts: parts
      };
    }).filter(content => content.parts.length > 0);

    const ai = this.getClient();
    this.chatSession = ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: instructions,
        temperature: 0.8,
      },
      history: history
    });
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) {
      this.initChat();
    }

    if (!this.chatSession) {
      throw new Error("Failed to initialize chat session.");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message });

      for await (const chunk of result) {
        const responseChunk = chunk as GenerateContentResponse;
        if (responseChunk.text) {
          yield responseChunk.text;
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  public async generateMapContent(prompt: string): Promise<{ text: string, mapData?: any[] }> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: ModelType.MAPS,
        contents: prompt,
        config: {
          systemInstruction: BASE_SYSTEM_INSTRUCTION + "\n\nProvide a helpful response about the location using the map tools.",
          tools: [{ googleMaps: {} }],
        }
      });

      const text = response.text || "I found this place on the map for you.";
      
      // Extract Google Maps grounding data if available
      // The groundingChunks contain the map URIs and titles
      let mapData = undefined;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (groundingChunks) {
        // Filter chunks that have map data
        mapData = groundingChunks.filter((chunk: any) => chunk.web?.uri && (chunk.web.uri.includes('google.com/maps') || chunk.web.uri.includes('maps.google.com')));
      }

      return { text, mapData: groundingChunks };
    } catch (error) {
      console.error("Error generating map:", error);
      throw error;
    }
  }

  public async *streamMathSolution(prompt: string, imageBase64?: string): AsyncGenerator<string, void, unknown> {
    try {
      // For Math, we use the Pro model for better reasoning
      const mathSystemInstruction = `
        ${BASE_SYSTEM_INSTRUCTION}
        
        \n\n**SPECIAL MODE: SMART MATH TUTOR**
        You are now acting as a wise tutor teaching mathematics and science.
        
        Guidelines for Calculation:
        1. **Think Before You Answer:** Carefully analyze the problem. Break it down into small steps.
        2. **Verify:** Double-check your arithmetic silently before outputting.
        3. **Explain:** Show your work. Do not just give the answer. Use the "Baba Baloch" persona to make it encouraging (e.g., "Like counting the stars over Quetta...").
        4. **Format:** Use clear formatting.
        
        If an image is provided, analyze the math problem in the image, transcribe it if necessary, and solve it step-by-step.
      `;

      const parts: Part[] = [];
      
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        });
      }
      
      parts.push({ text: prompt || "Solve this problem." });

      const ai = this.getClient();
      const response = await ai.models.generateContentStream({
        model: ModelType.MATH,
        contents: { parts: parts },
        config: {
          systemInstruction: mathSystemInstruction,
          // Thinking config enables "smart" calculation by allowing the model to reason silently
          thinkingConfig: { thinkingBudget: 2048 }, 
        }
      });

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }

    } catch (error) {
      console.error("Error solving math:", error);
      throw error;
    }
  }

  public async generateImage(prompt: string, imageBase64?: string): Promise<string | null> {
    try {
      const parts: Part[] = [];
      
      if (imageBase64) {
         parts.push({
           inlineData: {
             mimeType: 'image/png', // Generic MIME type for base64 image
             data: imageBase64
           }
         });
      }
      
      // Ensure prompt is not empty for image generation
      parts.push({ text: prompt || "Generate an image" });

      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: ModelType.IMAGE,
        contents: {
          parts: parts,
        },
        config: {
           // We do not set imageConfig size here as flash-image only supports defaults or specific aspect ratios
        }
      });

      // Iterate through parts to find the image
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  public async generateVideo(prompt: string, resolution: VideoResolution, inputImageBase64?: string): Promise<string | null> {
    try {
      const ai = this.getClient();
      let operation;
      
      const config = {
        numberOfVideos: 1,
        resolution: resolution, // '720p' or '1080p'
        aspectRatio: '16:9'
      };

      try {
        if (inputImageBase64) {
          // Image to Video
          operation = await ai.models.generateVideos({
            model: ModelType.VEO,
            prompt: prompt || "Animate this image cinematically", // Default prompt if user only uploads image
            image: {
              imageBytes: inputImageBase64,
              mimeType: 'image/png', // Assuming PNG for generic base64 handling
            },
            config: config
          });
        } else {
          // Text to Video
          operation = await ai.models.generateVideos({
            model: ModelType.VEO,
            prompt: prompt,
            config: config
          });
        }
      } catch (e: any) {
        if (e.message && e.message.includes("Requested entity was not found")) {
            const win = window as any;
            if (win.aistudio && win.aistudio.openSelectKey) {
                await win.aistudio.openSelectKey();
                throw new Error("Billing-enabled API Key required. Please select a key and try again.");
            }
        }
        throw e;
      }

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) {
        throw new Error("Video generation completed but no URI returned.");
      }

      // Fetch the video content
      // The response.body contains the MP4 bytes. We must append the API key.
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const videoBlob = await response.blob();
      
      // Convert Blob to Base64 to store in our simple message state
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  public async generateSpeech(text: string, voiceName: string = 'Charon'): Promise<string | null> {
    try {
      const ai = this.getClient();
      // Use the gemini-2.5-flash-preview-tts model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
           parts: [{ text: text }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || null;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
