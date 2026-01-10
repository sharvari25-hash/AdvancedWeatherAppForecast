import { getWeather, getForecast, getAirQuality, searchCities, getCityName } from './api.js';
import { UI } from './ui.js';
import { Storage } from './storage.js';
import { Theme } from './theme.js';

// State
let currentCity = Storage.getLastCity() || 'London'; // Default
let currentUnit = Storage.getUnit();
let searchTimeout = null;

// DOM Elements
const searchInput = document.getElementById('city-search');
const themeToggle = document.getElementById('theme-toggle');
const locateBtn = document.getElementById('locate-btn');
const unitToggles = document.querySelectorAll('.unit-toggle span');
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view-section');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadWeather(currentCity);
    initEventListeners();
    
    // Apply saved theme mode
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

function initEventListeners() {
    // Search with Debounce
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length > 2) {
            searchTimeout = setTimeout(async () => {
                const cities = await searchCities(query);
                UI.renderSuggestions(cities, (selectedCity) => {
                    loadWeather(selectedCity.name);
                });
            }, 400); // 400ms debounce
        } else {
            UI.hideSuggestions();
        }
    });

    searchInput.addEventListener('blur', () => UI.hideSuggestions());
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadWeather(searchInput.value);
            UI.hideSuggestions();
        }
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const isDark = Theme.toggleDarkMode();
        localStorage.setItem('dark-mode', isDark);
    });

    // Geolocation
    locateBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async position => {
                const { latitude, longitude } = position.coords;
                const city = await getCityName(latitude, longitude);
                if (city) loadWeather(city);
            }, err => {
                alert("Location access denied or unavailable.");
            });
        }
    });

    // Unit Toggle
    unitToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            unitToggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUnit = btn.dataset.unit;
            Storage.setUnit(currentUnit);
            loadWeather(currentCity);
        });
    });

    // Navigation / View Switching
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.dataset.view;
            if (!viewId) return; // Theme toggle has no data-view

            // Update UI
            navLinks.forEach(l => l.classList.remove('active'));
            if (link.id !== 'theme-toggle') link.classList.add('active');

            views.forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            
            const activeView = document.getElementById(`${viewId}-view`);
            if (activeView) {
                activeView.classList.remove('hidden');
                activeView.classList.add('active');
            }

            // Specific View Logic
            if (viewId === 'favorites') {
                UI.renderFavorites((city) => {
                    // Switch to dashboard and load
                    document.querySelector('[data-view="dashboard"]').click();
                    loadWeather(city);
                });
            }
        });
    });

    // Comparison Logic
    document.getElementById('compare-btn').addEventListener('click', async () => {
        const c1 = document.getElementById('compare-city-1').value;
        const c2 = document.getElementById('compare-city-2').value;
        if(c1 && c2) {
             const d1 = await getWeather(c1, currentUnit);
             const d2 = await getWeather(c2, currentUnit);
             renderComparison(d1, d2);
        }
    });
}

// Core Weather Loader
async function loadWeather(city) {
    if (!city) return;
    UI.showLoader();
    try {
        const weather = await getWeather(city, currentUnit);
        const { lat, lon } = weather.coord;
        
        const forecast = await getForecast(lat, lon, currentUnit);
        const aqi = await getAirQuality(lat, lon);

        // Cache Data
        Storage.setCachedWeather({ weather, forecast, aqi });

        // Update State
        currentCity = weather.name;
        Storage.setLastCity(currentCity);

        // Render
        renderAll(weather, forecast, aqi);

    } catch (error) {
        console.error("Fetch failed, trying cache", error);
        
        const cached = Storage.getCachedWeather();
        if (cached && cached.data) {
            alert("Offline Mode: Showing cached data.");
            const { weather, forecast, aqi } = cached.data;
            renderAll(weather, forecast, aqi);
            currentCity = weather.name; // Ensure state aligns with cache
        } else {
            alert("City not found or API error, and no cache available.");
        }
    }
}

function renderAll(weather, forecast, aqi) {
    UI.renderCurrent(weather);
    UI.renderHourly(forecast);
    UI.renderDaily(forecast);
    UI.renderHighlights(weather, aqi);
    UI.renderAlerts(weather, aqi);

    // Dynamic Theme
    const isNight = (Date.now() / 1000) > weather.sys.sunset || (Date.now() / 1000) < weather.sys.sunrise;
    Theme.setTheme(weather.weather[0].id, isNight);

    // Update Favorite Status in UI
    updateFavoriteUI(weather.name);
}

function updateFavoriteUI(city) {
    // Check if city is fav
    const isFav = Storage.isFavorite(city);
    // Find a place to show the star - manipulating DOM directly here for simplicity
    const nameEl = document.getElementById('city-name');
    
    // Remove existing star if any
    const existingStar = nameEl.querySelector('.fav-star');
    if (existingStar) existingStar.remove();

    const star = document.createElement('i');
    star.className = isFav ? 'fa-solid fa-star fav-star' : 'fa-regular fa-star fav-star';
    star.style.marginLeft = '10px';
    star.style.cursor = 'pointer';
    star.style.color = 'var(--warning-color)';
    star.style.fontSize = '1.2rem';
    
    star.onclick = (e) => {
        e.stopPropagation();
        if (isFav) {
            Storage.removeFavorite(city);
            star.className = 'fa-regular fa-star fav-star';
        } else {
            Storage.addFavorite(city);
            star.className = 'fa-solid fa-star fav-star';
        }
    };
    nameEl.appendChild(star);
}

function renderComparison(d1, d2) {
    const r = document.getElementById('comparison-result');
    const c1 = document.getElementById('compare-col-1');
    const c2 = document.getElementById('compare-col-2');
    
    r.classList.remove('hidden');
    
    const template = (d) => `
        <h3>${d.name}, ${d.sys.country}</h3>
        <div style="font-size: 2rem; font-weight: bold; margin: 10px 0;">${Math.round(d.main.temp)}°</div>
        <p>${d.weather[0].description}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
        <p>Humidity: ${d.main.humidity}%</p>
        <p>Wind: ${d.wind.speed} m/s</p>
        <p>Feels Like: ${Math.round(d.main.feels_like)}°</p>
        <p>Pressure: ${d.main.pressure} hPa</p>
    `;

    c1.innerHTML = template(d1);
    c2.innerHTML = template(d2);
}
