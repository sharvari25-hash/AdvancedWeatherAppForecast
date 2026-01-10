const STORAGE_KEYS = {
    LAST_CITY: 'weather_last_city',
    FAVORITES: 'weather_favorites',
    THEME: 'weather_theme',
    UNIT: 'weather_unit'
};

export const Storage = {
    setLastCity(city) {
        localStorage.setItem(STORAGE_KEYS.LAST_CITY, city);
    },

    getLastCity() {
        return localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    },

    getFavorites() {
        const favs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        return favs ? JSON.parse(favs) : [];
    },

    addFavorite(city) {
        const favs = this.getFavorites();
        if (!favs.includes(city)) {
            favs.push(city);
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
        }
    },

    removeFavorite(city) {
        let favs = this.getFavorites();
        favs = favs.filter(c => c !== city);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    },

    isFavorite(city) {
        return this.getFavorites().includes(city);
    },

    setTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },

    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    },

    setUnit(unit) {
        localStorage.setItem(STORAGE_KEYS.UNIT, unit);
    },

    getUnit() {
        return localStorage.getItem(STORAGE_KEYS.UNIT) || 'metric';
    },

    setCachedWeather(data) {
        localStorage.setItem('weather_cache_current', JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    },

    getCachedWeather() {
        const cache = localStorage.getItem('weather_cache_current');
        if (!cache) return null;
        return JSON.parse(cache);
    }
};
