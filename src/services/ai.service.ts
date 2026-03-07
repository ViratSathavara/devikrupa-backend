const axios = require("axios");

export const generateAIResponse = async (conversationHistory: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const modelPath = configuredModel.startsWith("models/")
    ? configuredModel
    : `models/${configuredModel}`;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  try {
    const systemPrompt = `
You are Devikrupa Electrical shop assistant from Visnagar.
Speak in simple Gujarati mixed with easy English.
Do not use technical words.
Keep replies short and friendly.
Products: switches, wires, boards, fans, bulbs.
Offer discount for bulk orders.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt + "\n" + conversationHistory }
            ],
          },
        ],
      }
    );

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      throw new Error("Empty AI response");
    }

    return aiText;

  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "AI failed");
  }
};

module.exports = { generateAIResponse };
