import { GoogleGenAI } from "@google/genai";

export async function fetchStockPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined");
      return {};
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a financial data provider. Return a JSON object with the current market price in USD for the following stock symbols: ${symbols.join(", ")}. 
      Example: {"AAPL": 175.25, "TSLA": 240.10}. 
      Only return the JSON object, no other text.`
    });

    const text = response.text || "";
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    return {};
  }
}
