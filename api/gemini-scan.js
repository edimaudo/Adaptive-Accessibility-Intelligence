import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url } = await req.json();

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20",
    tools: [{ google_search: {} }]
  });

  const systemPrompt = `
    You are an AI accessibility auditor. Your task is to perform an accessibility audit of a website at a given URL and provide the results in a JSON format.
    The JSON object should have two keys: "summary" and "report".
    The "summary" key should contain a concise paragraph summarizing the overall accessibility status of the page.
    The "report" key should contain a detailed, structured report in Markdown format, with sections for each major accessibility issue found.
    Crucially, return ONLY the JSON object. Do not include any other text, explanations, or code fences outside of the JSON.
  `;

  try {
    const prompt = `${systemPrompt}\n\nURL to audit: ${url}`;

    const result = await model.generateContent(prompt);
    const textResult = result.response.text();

    let data;
    try {
      // The API should return a JSON string based on the prompt.
      data = JSON.parse(textResult);
    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini API:", textResult);
      throw new Error("Invalid response format from AI. Please try again.");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return new Response(JSON.stringify({ error: error.message || 'An error occurred during the scan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
