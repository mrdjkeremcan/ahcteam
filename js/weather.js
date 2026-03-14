const Weather = {
    apiKey: 'https://api.open-meteo.com/v1/forecast?latitude=37.8597&longitude=27.2581&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto',
    currentData: null,

    init() {
        try {
            this.fetch();
            this.startClock();
            // Refresh weather every 30 mins
            setInterval(() => this.fetch(), 1800000);
        } catch (e) {
            console.warn("AHC: Weather Init failed", e);
        }
    },

    async fetch() {
        try {
            const res = await fetch(this.apiKey);
            if (!res.ok) throw new Error("API fail");
            const data = await res.json();
            this.currentData = data.current;
            this.render();
        } catch (err) {
            console.warn('Weather fetch error (falling back to default):', err);
            this.currentData = { temperature_2m: 22 }; // Fallback
            this.render();
        }
    },

    startClock() {
        const updateClock = () => {
            try {
                const now = new Date();
                const clockEl = document.getElementById('live-clock');
                if (clockEl) {
                    const lang = (typeof AppState !== 'undefined' && AppState.currentLang) ? AppState.currentLang : 'tr';
                    const locale = lang === 'tr' ? 'tr-TR' : 
                                   lang === 'bg' ? 'bg-BG' : 
                                   lang === 'de' ? 'de-DE' : 
                                   lang === 'ru' ? 'ru-RU' : 
                                   lang === 'fr' ? 'fr-FR' : 
                                   lang === 'pl' ? 'pl-PL' : 'en-GB';
                    clockEl.textContent = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            } catch (e) { }
        };
        setInterval(updateClock, 1000);
    },

    render() {
        try {
            const container = document.getElementById('weather-container');
            if (!container) return;

            const temp = this.currentData ? Math.round(this.currentData.temperature_2m) : '--';
            const lang = (typeof AppState !== 'undefined' && AppState.currentLang) ? AppState.currentLang : 'tr';
            const locale = lang === 'tr' ? 'tr-TR' : 
                           lang === 'bg' ? 'bg-BG' : 
                           lang === 'de' ? 'de-DE' : 
                           lang === 'ru' ? 'ru-RU' : 
                           lang === 'fr' ? 'fr-FR' : 
                           lang === 'pl' ? 'pl-PL' : 'en-GB';
            const now = new Date();
            const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const cityLabel = (typeof I18n !== 'undefined') ? I18n.getT('weather.city') : 'Kuşadası';

            container.innerHTML = `
                <div class="weather-clock-widget fade-in">
                    <div class="widget-side clock-side">
                        <i class="ph ph-clock"></i>
                        <span id="live-clock">${timeStr}</span>
                    </div>
                    <div class="widget-divider"></div>
                    <div class="widget-side weather-side">
                        <i class="ph ph-sun"></i>
                        <div class="weather-info">
                            <span class="city">${cityLabel}</span>
                            <span class="temp">${temp}°C</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("AHC Weather Render Fail:", e);
        }
    }
};

window.Weather = Weather;
