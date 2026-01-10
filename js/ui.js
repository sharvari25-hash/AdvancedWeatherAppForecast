import { Storage } from './storage.js';

const elements = {
    cityName: document.getElementById('city-name'),
    date: document.getElementById('current-date'),
    temp: document.getElementById('current-temp'),
    icon: document.getElementById('weather-icon'),
    desc: document.getElementById('weather-desc'),
    uvGauge: document.getElementById('uv-gauge'),
    uvValue: document.getElementById('uv-value'),
    windSpeed: document.getElementById('wind-speed'),
    windDir: document.getElementById('wind-dir'),
    sunrise: document.getElementById('sunrise-time'),
    sunset: document.getElementById('sunset-time'),
    humidity: document.getElementById('humidity'),
    humidityStatus: document.getElementById('humidity-status'),
    visibility: document.getElementById('visibility'),
    visStatus: document.getElementById('visibility-status'),
    aqiValue: document.getElementById('aqi-value'),
    aqiStatus: document.getElementById('aqi-status'),
    hourlyContainer: document.getElementById('hourly-container'),
    dailyContainer: document.getElementById('daily-container'),
    favoritesContainer: document.getElementById('favorites-container'),
    alertsContainer: document.getElementById('alerts-container'),
    suggestions: document.getElementById('search-suggestions')
};

export const UI = {
    formatDate(unixTime, timezoneOffset) {
        const date = new Date((unixTime + timezoneOffset) * 1000);
        // Correcting for local time by stripping UTC shift logic if needed, 
        // but simple formatting is usually enough.
        // Actually, to show "local time at city", we need to handle timezone carefully.
        // This is a simple approximation relying on browser UTC handling + offset.
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cityDate = new Date(utc + (timezoneOffset * 1000));
        
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        return cityDate.toLocaleDateString('en-US', options);
    },

    formatTime(unixTime, timezoneOffset) {
        const date = new Date((unixTime + timezoneOffset) * 1000);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cityDate = new Date(utc + (timezoneOffset * 1000));
        return cityDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    getDirection(deg) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(deg / 45) % 8];
    },

    renderCurrent(data) {
        if (!data) return;

        elements.cityName.innerText = `${data.name}, ${data.sys.country}`;
        elements.date.innerText = this.formatDate(Date.now() / 1000, data.timezone);
        elements.temp.innerText = `${Math.round(data.main.temp)}°`;
        elements.desc.innerText = data.weather[0].description;
        
        const iconCode = data.weather[0].icon;
        elements.icon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        elements.icon.classList.remove('hidden');

        // Highlights
        elements.windSpeed.innerText = `${data.wind.speed} m/s`;
        elements.windDir.innerText = this.getDirection(data.wind.deg);
        elements.sunrise.innerText = this.formatTime(data.sys.sunrise, data.timezone);
        elements.sunset.innerText = this.formatTime(data.sys.sunset, data.timezone);
        elements.humidity.innerText = `${data.main.humidity}%`;
        elements.humidityStatus.innerText = this.getHumidityStatus(data.main.humidity);
        elements.visibility.innerText = `${(data.visibility / 1000).toFixed(1)} km`;
        elements.visStatus.innerText = this.getVisibilityStatus(data.visibility);

        // UV Index (Now available from Open-Meteo adapter)
        if (data.uv !== undefined) {
             elements.uvValue.innerText = data.uv;
             // Gauge fill approx: Max UV is usually 11+
             const pct = Math.min(100, (data.uv / 11) * 100);
             elements.uvGauge.style.width = `${pct}%`;
        } else {
             elements.uvValue.innerText = "N/A"; 
             elements.uvGauge.style.width = "0%";
        }
    },

    renderAQI(aqiData) {
        if (!aqiData || !aqiData.list) {
            elements.aqiValue.innerText = "--";
            elements.aqiStatus.innerText = "N/A";
            return;
        }
        const aqi = aqiData.list[0].main.aqi;
        const labels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
        elements.aqiValue.innerText = aqi;
        elements.aqiStatus.innerText = labels[aqi];
        
        // Color coding logic could be added here
    },

    renderHourly(forecastData) {
        if (!forecastData) return;
        elements.hourlyContainer.innerHTML = '';
        
        // Take first 8 entries (approx 24 hours)
        const next24Hours = forecastData.list.slice(0, 8);
        
        next24Hours.forEach(item => {
            const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            const temp = Math.round(item.main.temp);
            const icon = item.weather[0].icon;
            
            // Graph Simulation: Height based on temp (normalize roughly between -10 and 40)
            const barHeight = Math.max(20, Math.min(100, (temp + 10) * 2)); // minimal scaling logic

            const div = document.createElement('div');
            div.className = 'hourly-item';
            div.innerHTML = `
                <span style="width: 60px">${time}</span>
                <div style="flex:1; display:flex; align-items:center;">
                    <img src="https://openweathermap.org/img/wn/${icon}.png" style="width:30px">
                    <div class="hourly-graph-bar" style="width: ${barHeight}px;"></div>
                </div>
                <span>${temp}°</span>
            `;
            elements.hourlyContainer.appendChild(div);
        });
    },

    renderDaily(forecastData) {
        if (!forecastData) return;
        elements.dailyContainer.innerHTML = '';

        // Extract one reading per day (e.g., closest to noon)
        const dailyData = [];
        const seenDates = new Set();

        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!seenDates.has(date)) {
                // Check if time is around noon (12:00) or just take the first one if we want simple unique days
                if (item.dt_txt.includes("12:00:00")) {
                     seenDates.add(date);
                     dailyData.push(item);
                }
            }
        });

        // If we don't have enough noon data (e.g. late night fetch), fill with others
        if (dailyData.length < 5) {
             // Fallback logic could go here, but for now rendering what we have
        }

        dailyData.slice(0, 7).forEach(item => {
            const dateObj = new Date(item.dt * 1000);
            const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const date = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const temp = Math.round(item.main.temp);
            const icon = item.weather[0].icon;

            const div = document.createElement('div');
            div.className = 'daily-item';
            div.innerHTML = `
                <p>${day}</p>
                <p style="font-size: 0.8rem; color: var(--text-secondary)">${date}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" style="width: 50px">
                <p style="font-weight: 600">${temp}°</p>
            `;
            elements.dailyContainer.appendChild(div);
        });
    },

    renderSuggestions(cities, onSelect) {
        elements.suggestions.innerHTML = '';
        if (!cities || cities.length === 0) {
            elements.suggestions.classList.add('hidden');
            return;
        }

        cities.forEach(city => {
            const li = document.createElement('li');
            li.innerText = `${city.name}, ${city.state ? city.state + ', ' : ''}${city.country}`;
            li.onclick = () => {
                onSelect(city);
                elements.suggestions.classList.add('hidden');
                document.getElementById('city-search').value = city.name;
            };
            elements.suggestions.appendChild(li);
        });
        elements.suggestions.classList.remove('hidden');
    },

    renderFavorites(onSelect) {
        const favs = Storage.getFavorites();
        elements.favoritesContainer.innerHTML = '';
        
        if (favs.length === 0) {
            elements.favoritesContainer.innerHTML = '<p>No favorites added yet.</p>';
            return;
        }

        favs.forEach(city => {
            const div = document.createElement('div');
            div.className = 'fav-card';
            div.innerText = city; // Simple text for now, could fetch weather for each
            div.onclick = () => onSelect(city);
            elements.favoritesContainer.appendChild(div);
        });
    },

    renderAlerts(weatherData, aqiData) {
        elements.alertsContainer.innerHTML = '';
        const alerts = [];

        // Temperature Alert
        if (weatherData.main.temp > 35) alerts.push("Extreme Heat Warning: Stay hydrated!");
        if (weatherData.main.temp < 0) alerts.push("Freezing Warning: Wear warm clothes!");

        // Wind Alert
        if (weatherData.wind.speed > 15) alerts.push("High Wind Warning");

        // AQI Alert
        if (aqiData && aqiData.list[0].main.aqi >= 4) alerts.push("Poor Air Quality Warning");

        // Weather Condition Alert
        const id = weatherData.weather[0].id;
        if (id >= 200 && id <= 232) alerts.push("Thunderstorm Alert");
        if (id >= 500 && id <= 531) alerts.push("Rain Warning");

        alerts.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'alert';
            div.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${msg}`;
            elements.alertsContainer.appendChild(div);
        });
    },

    getHumidityStatus(h) {
        if (h < 30) return "Dry";
        if (h < 60) return "Comfortable";
        return "Humid";
    },

    getVisibilityStatus(v) {
        if (v > 10000) return "Excellent";
        if (v > 5000) return "Good";
        if (v > 2000) return "Moderate";
        return "Poor";
    },
    
    showLoader() {
        // Simple opacity or spinner logic could be added
        elements.cityName.innerText = "Loading...";
    },

    hideSuggestions() {
        setTimeout(() => elements.suggestions.classList.add('hidden'), 200);
    }
};
