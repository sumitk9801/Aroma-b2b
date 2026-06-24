/**
 * OpenAI Provider — V2.6 AI Business Assistant
 *
 * Wraps the OpenAI Chat Completions API.
 * Requires: OPENAI_API_KEY in .env
 * Model: Configurable via LLM_MODEL env var (default: gpt-4o-mini for cost efficiency)
 *
 * Note: Uses native fetch (Node.js 18+) — no openai npm package required.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Send a chat completion request to OpenAI.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} LLM response text
 */
const complete = async (systemPrompt, userPrompt) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in environment variables");

    const model     = process.env.LLM_MODEL      || "gpt-4o-mini";
    const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || "1024", 10);

    const response = await fetch(OPENAI_API_URL, {
        method:  "POST",
        headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user",   content: userPrompt   },
            ],
            temperature: 0.3, // Low temperature for factual, consistent responses
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "No response generated.";
};

module.exports = { complete };
