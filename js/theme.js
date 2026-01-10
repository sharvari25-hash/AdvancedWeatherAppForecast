export const Theme = {
    setTheme(weatherId, isNight) {
        const body = document.body;
        
        // Reset specific theme classes
        body.classList.remove('theme-sunny', 'theme-rain', 'theme-snow');

        // Dark mode priority
        if (body.classList.contains('dark-mode')) return;

        if (isNight) {
            // Optional: Add specific night theme if needed, usually dark mode handles it
            return;
        }

        // Weather ID based themes (OpenWeatherMap Condition Codes)
        // 2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain
        if (weatherId >= 200 && weatherId <= 531) {
            body.classList.add('theme-rain');
        } 
        // 6xx: Snow
        else if (weatherId >= 600 && weatherId <= 622) {
            body.classList.add('theme-snow');
        } 
        // 800: Clear
        else if (weatherId === 800) {
            body.classList.add('theme-sunny');
        }
        // 80x: Clouds (Default/Neutral)
    },

    toggleDarkMode() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        return body.classList.contains('dark-mode');
    }
};
