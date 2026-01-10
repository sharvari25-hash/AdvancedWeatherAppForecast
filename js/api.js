// OPEN-METEO API ADAPTER (Free, No Key Required)
// Docs: https://open-meteo.com/

const BASE_URL = "https://api.open-meteo.com/v1";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1";
const AQI_URL = "https://air-quality-api.open-meteo.com/v1";

/**
 * Maps WMO Weather Codes to OWM-compatible structure
 * WMO Codes: https://open-meteo.com/en/docs
 */
function decodeWMO(code) {
    const map = {
        0: { id: 800, main: "Clear", desc: "Clear sky", icon: "01d" },
        1: { id: 801, main: "Clouds", desc: "Mainly clear", icon: "02d" },
        2: { id: 802, main: "Clouds", desc: "Partly cloudy", icon: "03d" },
        3: { id: 803, main: "Clouds", desc: "Overcast", icon: "04d" },
        45: { id: 701, main: "Fog", desc: "Fog", icon: "50d" },
        48: { id: 741, main: "Fog", desc: "Depositing rime fog", icon: "50d" },
        51: { id: 300, main: "Drizzle", desc: "Light drizzle", icon: "09d" },
        53: { id: 301, main: "Drizzle", desc: "Moderate drizzle", icon: "09d" },
        55: { id: 302, main: "Drizzle", desc: "Dense drizzle", icon: "09d" },
        61: { id: 500, main: "Rain", desc: "Slight rain", icon: "10d" },
        63: { id: 501, main: "Rain", desc: "Moderate rain", icon: "10d" },
        65: { id: 502, main: "Rain", desc: "Heavy rain", icon: "10d" },
        71: { id: 600, main: "Snow", desc: "Slight snow", icon: "13d" },
        73: { id: 601, main: "Snow", desc: "Moderate snow", icon: "13d" },
        75: { id: 602, main: "Snow", desc: "Heavy snow", icon: "13d" },
        95: { id: 200, main: "Thunderstorm", desc: "Thunderstorm", icon: "11d" },
        96: { id: 201, main: "Thunderstorm", desc: "Thunderstorm with hail", icon: "11d" },
        99: { id: 202, main: "Thunderstorm", desc: "Thunderstorm with heavy hail", icon: "11d" }
    };
    return map[code] || { id: 800, main: "Clear", desc: "Unknown", icon: "01d" };
}

/**
 * 1. Search City (Geocoding)
 */
export async function searchCities(query) {
    if (!query) return [];
    try {
        const res = await fetch(`${GEO_URL}/search?name=${query}&count=5&language=en&format=json`);
        const data = await res.json();
        
        if (!data.results) return [];

        // Map to uniform format
        return data.results.map(city => ({
            name: city.name,
            country: city.country_code,
            state: city.admin1,
            lat: city.latitude,
            lon: city.longitude
        }));
    } catch (error) {
        console.error("Geo Error", error);
        return [];
    }
}

/**
 * 2. Get Current Weather
 * Adapts Open-Meteo response to match OpenWeatherMap structure for compatibility
 */
export async function getWeather(city, unit = 'metric') {
    try {
        // Step A: We need coordinates first (if city is a string)
        // If the app passed coordinates previously, this might be redundant but safe
        let lat, lon, name, country;
        
        const searchResults = await searchCities(city);
        if (!searchResults.length) throw new Error("City not found");
        
        const loc = searchResults[0];
        lat = loc.lat;
        lon = loc.lon;
        name = loc.name;
        country = loc.country;

        // Step B: Fetch Weather Data
        const unitParam = unit === 'imperial' ? 'fahrenheit' : 'celsius';
        const windParam = unit === 'imperial' ? 'mph' : 'ms';
        
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current_weather: true,
            hourly: "relativehumidity_2m,surface_pressure,visibility",
            daily: "sunrise,sunset,uv_index_max",
            timezone: "auto",
            temperature_unit: unitParam,
            windspeed_unit: windParam
        });

        const res = await fetch(`${BASE_URL}/forecast?${params}`);
        if (!res.ok) throw new Error("Weather data unavailable");
        const data = await res.json();

        // Step C: Adapt Data
        const current = data.current_weather;
        const weatherInfo = decodeWMO(current.weathercode);
        
        // Find current hour index for hourly data mapping
        // Open-Meteo returns hourly data starting from 00:00 today.
        const currentHour = new Date().getHours();
        
        return {
            name: name,
            coord: { lat, lon },
            sys: {
                country: country,
                sunrise: new Date(data.daily.sunrise[0]).getTime() / 1000,
                sunset: new Date(data.daily.sunset[0]).getTime() / 1000
            },
            main: {
                temp: current.temperature,
                feels_like: current.temperature, // Simple fallback
                humidity: data.hourly.relativehumidity_2m[currentHour] || 0,
                pressure: data.hourly.surface_pressure[currentHour] || 1013
            },
            weather: [{
                id: weatherInfo.id,
                main: weatherInfo.main,
                description: weatherInfo.desc,
                icon: weatherInfo.icon
            }],
            wind: {
                speed: current.windspeed,
                deg: current.winddirection
            },
            visibility: data.hourly.visibility ? data.hourly.visibility[currentHour] : 10000,
            timezone: data.utc_offset_seconds,
            // Extra: pass UV index for UI to use if it wants
            uv: data.daily.uv_index_max[0] 
        };

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

/**
 * 3. Get Forecast (5 Day / 3 Hour equivalent)
 */
export async function getForecast(lat, lon, unit = 'metric') {
    try {
        const unitParam = unit === 'imperial' ? 'fahrenheit' : 'celsius';
        const res = await fetch(`${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto&temperature_unit=${unitParam}`);
        const data = await res.json();

        // Convert flat arrays to OWM "list" object array
        const list = [];
        const times = data.hourly.time;
        const temps = data.hourly.temperature_2m;
        const codes = data.hourly.weathercode;

        for (let i = 0; i < times.length; i++) {
            // Simulate 3-hour steps to match OWM standard slightly, or just pass all
            // Passing all is fine, the UI slices what it needs.
            const w = decodeWMO(codes[i]);
            list.push({
                dt: new Date(times[i]).getTime() / 1000,
                dt_txt: times[i].replace('T', ' ') + ':00', // mimic "2023-10-10 12:00:00"
                main: {
                    temp: temps[i]
                },
                weather: [{
                    icon: w.icon,
                    description: w.desc
                }]
            });
        }

        return { list };

    } catch (error) {
        console.error(error);
        return { list: [] };
    }
}

/**
 * 4. Get Air Quality
 */
export async function getAirQuality(lat, lon) {
    try {
        const res = await fetch(`${AQI_URL}/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
        const data = await res.json();
        
        // Map US AQI (0-500) to OWM scale (1-5)
        // OWM: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
        // US AQI: 0-50 Good, 51-100 Moderate, 101-150 Unhealthy...
        
        let aqiVal = data.current.us_aqi;
        let owmAqi = 1;
        if (aqiVal > 50) owmAqi = 2;
        if (aqiVal > 100) owmAqi = 3;
        if (aqiVal > 150) owmAqi = 4;
        if (aqiVal > 200) owmAqi = 5;

        return {
            list: [{
                main: { aqi: owmAqi },
                components: { pm2_5: 0 } // Mock details if needed
            }]
        };
    } catch (error) {
        return { list: [{ main: { aqi: 1 } }] };
    }
}

export async function getCityName(lat, lon) {
    // Reverse Geo not strictly needed for this flow if we search by name, 
    // but useful for "Locate Me"
    // Open-Meteo doesn't have a direct "reverse geo" easily accessible in the same way,
    // but the search API supports lat/lon sometimes or we can just return "Your Location".
    // Actually, BigDataCloud has a free reverse geo, but let's stick to Open-Meteo logic or simple mock.
    // For now, let's try to fetch a nearby city.
    return "Current Location"; 
}