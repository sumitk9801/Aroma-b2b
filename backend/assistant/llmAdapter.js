const Logger = require("../utils/logger");

/**
 * LLM Adapter — V2.6 AI Business Assistant
 *
 * Provider-agnostic abstraction for LLM calls.
 * Swap between OpenAI, Gemini, or future providers via the LLM_PROVIDER env var.
 * No business logic here — just routing to the appropriate provider.
 *
 * Usage:
 *   LLM_PROVIDER=openai  → uses OpenAI gpt-4o-mini (default)
 *   LLM_PROVIDER=gemini  → uses Google Gemini 2.0 Flash
 */

const providers = {
    openai: require("./providers/openaiProvider"),
    gemini: require("./providers/geminiProvider"),
};

/**
 * Send prompts to the configured LLM provider.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} [providerOverride] - Override env var provider for testing
 * @returns {Promise<string>} LLM response text
 */
const ask = async (systemPrompt, userPrompt, providerOverride = null) => {
    const providerName = (providerOverride || process.env.LLM_PROVIDER || "gemini").toLowerCase();
    const provider     = providers[providerName];

    if (!provider) {
        const available = Object.keys(providers).join(", ");
        throw new Error(
            `Unknown LLM provider: "${providerName}". Available providers: ${available}. ` +
            `Set LLM_PROVIDER in your .env file.`
        );
    }

    Logger.info(`[LLMAdapter] Sending request via provider: ${providerName}`);

    try {
        const response = await provider.complete(systemPrompt, userPrompt);
        Logger.info(`[LLMAdapter] Response received from ${providerName} (${response.length} chars)`);
        return response;
    } catch (err) {
        Logger.error(`[LLMAdapter] Provider "${providerName}" failed: ${err.message}`);
        throw err;
    }
};

/**
 * Check if any LLM provider is properly configured.
 * @returns {{ configured: boolean, provider: string|null, missingKey: string|null }}
 */
const checkConfiguration = () => {
    const providerName = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

    const requiredKeys = {
        openai: "OPENAI_API_KEY",
        gemini: "GEMINI_API_KEY",
    };

    const requiredKey = requiredKeys[providerName];
    const isConfigured = requiredKey ? !!process.env[requiredKey] : false;

    return {
        configured:  isConfigured,
        provider:    providerName,
        missingKey:  isConfigured ? null : requiredKey,
        available:   Object.keys(providers),
    };
};

module.exports = {
    ask,
    checkConfiguration,
};
