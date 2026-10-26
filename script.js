// Initialization and DOM Selections
document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const getWeatherBtn = document.getElementById("get-weather-btn");
  const geoBtn = document.getElementById("geo-btn");
  const weatherInfo = document.getElementById("weather-info");
  const cityName = document.getElementById("city-name");
  const weatherIcon = document.getElementById("weather-icon");
  const temperature = document.getElementById("temperature");
  const feelsLike = document.getElementById("feels-like");
  const description = document.getElementById("description");
  const humidity = document.getElementById("humidity");
  const wind = document.getElementById("wind");
  const aqi = document.getElementById("aqi");
  const forecastContainer = document.getElementById("forecast-container");
  const errorMessage = document.getElementById("error-message");



  // AQI rating lookup map
  const aqiLevels = {
    1: "Good 🟢",
    2: "Fair 🟡",
    3: "Moderate 🟠",
    4: "Poor 🔴",
    5: "Very Poor 🟣",
  };

  // 1. Fetch Current Weather by City Name
  async function fetchWeatherByCity(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric`;

    // encodeURIComponent(city): Sanitizes user inputs containing special characters, spaces, or international characters so the URI remains valid.

    // units=metric: Instructs OpenWeatherMap to deliver temperatures in Celsius and wind speed in meters per second.

    handleWeatherFetch(url, city);
  }

  // 2. Fetch Current Weather by Coordinates (Geolocation)
  async function fetchWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`;
    handleWeatherFetch(url);
  }

  // 3. Core Handler for Weather API Requests / Main Request Processor:
  async function handleWeatherFetch(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("City not found");

      const data = await response.json();

      // Display main weather details
      displayWeather(data);

      // Fetch Air Quality and 5-Day Forecast concurrently
      const { lat, lon } = data.coord;
      fetchAirQuality(lat, lon);
      fetchForecast(lat, lon);
    } catch (error) {
      showError();
    }
  }

  // 4. Render Current Weather Data
  function displayWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    feelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
    description.textContent = data.weather[0].description;
    humidity.textContent = data.main.humidity;
    wind.textContent = data.wind.speed;

    // Load Weather Condition Icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    weatherInfo.classList.remove("hidden");
    errorMessage.classList.add("hidden");
  }

  // 5. Fetch Air Pollution Data (Free Endpoint)
  async function fetchAirQuality(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const aqiIndex = data.list[0].main.aqi;
        aqi.textContent = aqiLevels[aqiIndex] || "N/A";
      }
    } catch {
      aqi.textContent = "N/A";
    }
  }

  // 6. Fetch 5-Day Forecast Data (Free Endpoint)
  async function fetchForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      forecastContainer.innerHTML = "";

      // Filter data to grab 1 prediction per day around 12:00 PM
      const dailyData = data.list.filter((item) =>
        item.dt_txt.includes("12:00:00"),
      );

      dailyData.forEach((day) => {
        const date = new Date(day.dt * 1000).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
                    <p class="forecast-date">${date}</p>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" />
                    <p class="forecast-temp">${temp}°C</p>
                `;
        forecastContainer.appendChild(card);
      });
    } catch (error) {
      forecastContainer.innerHTML = "<p>Unable to load forecast.</p>";
    }
  }

  function showError() {
    weatherInfo.classList.add("hidden");
    errorMessage.classList.remove("hidden");
  }

  function handleSearch() {
    const city = cityInput.value.trim();
    if (city !== "") {
      fetchWeatherByCity(city);
    }
  }

  // 7. Handlers & Event Listeners
  getWeatherBtn.addEventListener("click", handleSearch);

  cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // 8. Device Geolocation Click Handler
  geoBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => alert("Unable to retrieve your location."),
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });

  // 9. Dark/Light Theme Switch Logic
  const toggleSwitch = document.getElementById("checkbox");
  const themeLabel = document.getElementById("theme-label");

  function switchTheme(e) {
    if (e.target.checked) {
      document.documentElement.setAttribute("data-theme", "light");
      themeLabel.textContent = "☀️ Light";
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeLabel.textContent = "🌙 Dark";
      localStorage.setItem("theme", "dark");
    }
  }

  toggleSwitch.addEventListener("change", switchTheme, false);

  // 10. Persist Theme Selection across Page Reloads
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "light") {
      toggleSwitch.checked = true;
      themeLabel.textContent = "☀️ Light";
    }
  }
});
