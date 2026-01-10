# 🌦️ Atmosphere: Advanced Weather Dashboard

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-2.0-green.svg)
![Status](https://img.shields.io/badge/Status-Active-orange.svg)

> A production-grade, aesthetically pleasing weather application built with Vanilla JavaScript, featuring glassmorphism UI, real-time data, and offline capabilities.

---

## 🌟 Features

### 🎨 Visuals & UI
*   **Glassmorphism Design:** Modern, translucent UI elements with backdrop blurs.
*   **Dynamic Theming:** The application changes its entire color palette based on the current weather (Sunny, Rainy, Snowy, Night).
*   **Dark Mode:** Built-in toggle for a high-contrast dark theme.
*   **Animated Graphs:** Custom CSS-only bar charts for hourly temperature visualization.

### 🚀 Core Functionality
*   **Smart Search:** Debounced city search with instant autocomplete suggestions.
*   **Dashboard View:** Comprehensive overview including Temperature, UV Index, Air Quality, Wind, and Visibility.
*   **7-Day Forecast:** detailed daily predictions.
*   **Comparison Mode:** Analyze weather metrics of two different cities side-by-side.
*   **Favorites:** Pin your most frequented locations for quick access.

### ⚡ Advanced Engineering
*   **Clean Architecture:** Strict separation of concerns (API, UI, Storage, Logic).
*   **Offline Support:** Caches weather data to `localStorage`. Works even when the internet goes down!
*   **No API Key Required:** Powered by the open-source **Open-Meteo API**.
*   **Metric/Imperial Switch:** Toggle between Celsius/Metric and Fahrenheit/Imperial units instantly.

---

## 📸 Screenshots

| **Sunny Day** | **Dark Mode** |
|:---:|:---:|
| <div style="width: 300px; height: 150px; background: linear-gradient(135deg, #fceabb 0%, #f8b500 100%); display: flex; align-items: center; justify-content: center; border-radius: 12px; color: white; font-weight: bold;">☀️ Sunny Theme</div> | <div style="width: 300px; height: 150px; background: #2c3e50; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: white; font-weight: bold;">🌑 Night Mode</div> |

---

## 🛠️ Installation & Setup

Since this project uses modern ES6 Modules, it requires a local server to run (to avoid CORS policies).

### Prerequisites
*   A modern web browser (Chrome, Edge, Firefox).
*   **Node.js** (Optional, for easy serving).

### Option 1: Using Node.js (Recommended)
1.  **Clone the repository** (or download the folder).
2.  Open your terminal in the project folder.
3.  Run the following command to start a temporary server:
    ```bash
    npx serve
    ```
4.  Open the URL shown (usually `http://localhost:3000`) in your browser.

### Option 2: Python
If you have Python installed:
```bash
python -m http.server
# Open http://localhost:8000
```

### Option 3: VS Code Live Server
1.  Install the **Live Server** extension in VS Code.
2.  Right-click `index.html`.
3.  Select **"Open with Live Server"**.

---

## 📂 Project Structure

```bash
📦 Weather-App
 ┣ 📂 css
 ┃ ┗ 📜 style.css       # Core styling & animations
 ┣ 📂 js
 ┃ ┣ 📜 api.js          # Open-Meteo API Adapter
 ┃ ┣ 📜 app.js          # Main Controller
 ┃ ┣ 📜 storage.js      # LocalStorage & Caching Logic
 ┃ ┣ 📜 theme.js        # Theme Switching Logic
 ┃ ┗ 📜 ui.js           # DOM Manipulation & Rendering
 ┗ 📜 index.html        # Main Entry Point
```

---

## 🔮 Future Roadmap

- [ ] **PWA Support:** Installable as a native app on mobile.
- [ ] **Push Notifications:** Alerts for severe weather.
- [ ] **Interactive Maps:** Radar view using Leaflet.js.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/yourusername">Your Name</a></p>
</div>
