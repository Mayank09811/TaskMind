import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      console.error("GEMINI_API_KEY is not set or is still the placeholder.");
      return NextResponse.json(
        { error: "API Key not found. Please restart your 'npm run dev' server to load the .env.local file." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Ensure history is in the format Gemini expects
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    return NextResponse.json(
      { error: "AI Service Error: " + (error.message || "Failed to get response") },
      { status: 500 }
    );
  }
}
