/**
 * Weather Adapter — V2.4 External Signals Engine
 *
 * Fetches and normalizes weather data from OpenWeatherMap API.
 * Falls back gracefully to seasonal defaults if API key is not configured.
 *
 * Impact logic:
 *   Extreme weather (storms, heavy rain)  → demand multiplier > 1.2 (panic buying)
 *   Mild/favorable weather                → multiplier ~1.0 (neutral)
 *   Heatwaves (for food/beverage shops)   → multiplier 1.1–1.3
 *
 * To enable: Set OPENWEATHER_API_KEY in .env
 */

const Logger = require("../../utils/logger");

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Demand impact by weather condition code (OpenWeatherMap codes)
const WEATHER_IMPACT_MAP = {
    // Thunderstorm group (200–299) — panic buying spikes
    200: { name: "Thunderstorm with light rain",  intensity: 1.15, description: "Storm expected — potential demand spike" },
    201: { name: "Thunderstorm with rain",         intensity: 1.20, description: "Heavy storm — significant demand spike" },
    202: { name: "Thunderstorm with heavy rain",   intensity: 1.25, description: "Severe storm — high demand spike" },

    // Drizzle group (300–399) — mild impact
    300: { name: "Light intensity drizzle",        intensity: 1.05, description: "Light drizzle — slight demand increase" },

    // Rain group (500–599) — moderate demand increase
    500: { name: "Light rain",                     intensity: 1.08, description: "Rain expected — moderate demand increase" },
    501: { name: "Moderate rain",                  intensity: 1.12, description: "Moderate rain — demand spike expected" },
    502: { name: "Heavy intensity rain",            intensity: 1.20, description: "Heavy rain — significant demand spike" },

    // Snow group (600–699) — supply disruption risk
    601: { name: "Snow",                            intensity: 1.15, description: "Snow — supply chain risk, stock up" },
    602: { name: "Heavy snow",                      intensity: 1.30, description: "Heavy snow — critical supply risk" },

    // Clear/Clouds (800–804) — neutral or slight decrease
    800: { name: "Clear sky",                       intensity: 1.00, description: "Clear weather — normal demand expected" },
    801: { name: "Few clouds",                      intensity: 0.98, description: "Partly cloudy — slightly below normal" },
    802: { name: "Scattered clouds",                intensity: 0.97, description: "Cloudy — minor demand reduction" },
    803: { name: "Broken clouds",                   intensity: 0.95, description: "Overcast — moderate demand reduction" },
    804: { name: "Overcast clouds",                 intensity: 0.93, description: "Heavy overcast — below normal demand" },
};

const DEFAULT_WEATHER_SIGNAL = {
    signalType: "WEATHER",
    signalName: "Normal Weather",
    intensity:  1.0,
    source:     "OPENWEATHER",
    metadata:   { note: "Default — API not configured or request failed" },
};

/**
 * Fetch current weather for a location and convert to signal payload.
 *
 * @param {Object} params
 * @param {string} params.shopId
 * @param {number} params.lat    - Latitude
 * @param {number} params.lon    - Longitude
 * @param {Date}   params.date   - Target date
 * @returns {Promise<ExternalSignalPayload[]>}
 */
const fetchSignals = async ({ shopId, lat, lon, date }) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        Logger.warn("[WeatherAdapter] OPENWEATHER_API_KEY not configured — using neutral default signal");
        return [DEFAULT_WEATHER_SIGNAL];
    }

    try {
        const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const conditionCode = data.weather?.[0]?.id;
        const impact = WEATHER_IMPACT_MAP[conditionCode] || { intensity: 1.0, name: "Unknown" };

        Logger.info(`[WeatherAdapter] Fetched weather for shop ${shopId}: ${impact.name} (intensity: ${impact.intensity})`);

        return [
            {
                signalType: "WEATHER",
                signalName: impact.name,
                intensity:  impact.intensity,
                source:     "OPENWEATHER",
                metadata: {
                    conditionCode,
                    temperature: data.main?.temp,
                    humidity:    data.main?.humidity,
                    windSpeed:   data.wind?.speed,
                    description: data.weather?.[0]?.description,
                    impact:      impact.description || "Standard weather conditions",
                },
            },
        ];
    } catch (err) {
        Logger.error(`[WeatherAdapter] Fetch failed for shop ${shopId}: ${err.message}`);
        return [DEFAULT_WEATHER_SIGNAL];
    }
};

/**
 * Get the demand intensity multiplier for a given weather condition code.
 * @param {number} conditionCode
 * @returns {number}
 */
const getWeatherIntensity = (conditionCode) => {
    return WEATHER_IMPACT_MAP[conditionCode]?.intensity || 1.0;
};

module.exports = {
    fetchSignals,
    getWeatherIntensity,
    WEATHER_IMPACT_MAP,
};
