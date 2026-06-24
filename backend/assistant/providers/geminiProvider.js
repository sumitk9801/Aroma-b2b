/**
 * Gemini Provider — V2.6 AI Business Assistant
 *
 * Wraps the Google Gemini API (generateContent endpoint).
 * Requires: GEMINI_API_KEY in .env
 * Model: Configurable via GEMINI_MODEL env var (default: gemini-2.0-flash for speed + cost)
 *
 * Note: Uses native fetch (Node.js 18+) — no @google/generative-ai npm package required.
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Send a content generation request to Google Gemini.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} LLM response text
 */
const complete = async (systemPrompt, userPrompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in environment variables");

    const model     = process.env.GEMINI_MODEL    || "gemini-2.0-flash";
    const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || "1024", 10);

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [
                {
                    role:  "user",
                    parts: [{ text: userPrompt }],
                },
            ],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature:     0.3, // Low temperature for factual responses
                topP:            0.8,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
        const blockReason = data.candidates?.[0]?.finishReason;
        throw new Error(`Gemini returned no content. Finish reason: ${blockReason || "unknown"}`);
    }

    return text;
};

module.exports = { complete };
