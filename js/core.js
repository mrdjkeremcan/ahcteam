/**
 * AHC TEAM - Premium Core Shared Logic
 * Supporting 7 languages, persistent state, haptics, and universal UI components.
 */

// --- PREMIUM UTILS ---
const Haptics = {
    vibrate(ms = 50) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (e) { }
        }
    },
    success() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([30, 50, 30]); } catch (e) { }
        }
    }
};

const ScrollAnim = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Slight delay for staggered feel
                    setTimeout(() => observer.unobserve(entry.target), 100);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.program-card:not(.visible)').forEach(card => {
            card.classList.add('scroll-reveal');
            observer.observe(card);
        });
    }
};

const PageTransition = {
    play(callback) {
        document.body.classList.remove('page-enter');
        document.body.classList.add('page-exit');
        setTimeout(() => {
            if (callback) callback();
        }, 300); // match pageExit CSS timing
    }
};

// --- DATA MIGRATION ---
const APP_VERSION = 'v2.4';

// Safe LocalStorage Wrapper
const Storage = {
    set(key, val) {
        try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) { }
    },
    get(key, isJson = false) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return null;
            return isJson ? JSON.parse(val) : val;
        } catch (e) { 
            console.warn(`AHC Storage Error (${key}):`, e);
            return null; 
        }
    }
};

// Dependency Guard
if (typeof DefaultData === 'undefined') {
    console.warn("AHC: DefaultData missing.");
    window.DefaultData = { programs: { daily: [], party: [], evening: [], miniclub: [] }, team: [] };
}
if (typeof translations === 'undefined') {
    console.warn("AHC: Translations missing.");
    window.translations = { tr: { nav: {}, hero: {}, footer: {}, admin: {}, act: {}, loc: {}, days: {}, errors: {} } };
}

if (localStorage.getItem('ahc_app_version') !== APP_VERSION) {
    // Migration: Avoid wiping user data unless structure changes significantly.
    // For v1.2, we just ensure the new 'party' category exists.
    const saved = JSON.parse(localStorage.getItem('ahc_programs')) || {};
    if (saved && !saved.party) {
        saved.party = [];
        localStorage.setItem('ahc_programs', JSON.stringify(saved));
    }
    localStorage.setItem('ahc_app_version', APP_VERSION);
}

// --- STATE MANAGEMENT ---
const AppState = {
    currentLang: Storage.get('ahc_lang') || 'tr',
    isAuthenticated: sessionStorage.getItem('ahc_auth') === 'true',
    currentAdminTab: Storage.get('ahc_admin_tab') || 'daily',
    programs: (() => {
        const saved = Storage.get('ahc_programs', true) || {};
        const defaults = DefaultData.programs;
        return {
            daily: saved.daily !== undefined ? saved.daily : (defaults.daily || []),
            party: saved.party !== undefined ? saved.party : (defaults.party || []),
            evening: saved.evening !== undefined ? saved.evening : (defaults.evening || []),
            miniclub: saved.miniclub !== undefined ? saved.miniclub : (defaults.miniclub || [])
        };
    })(),
    team: Storage.get('ahc_team', true) || DefaultData.team,
    analytics: Storage.get('ahc_analytics', true) || { views: {}, clicks: 0 },
    notifications: Storage.get('ahc_notifs', true) || [],
    favorites: Storage.get('ahc_favorites', true) || [],
    reminderTime: parseInt(Storage.get('ahc_reminder_time')) || 15,
    getBasePath: () => {
        const path = window.location.pathname;
        // More robust detection: check segment counts relative to root
        // GitHub Pages typically has /repo-name/ as root.
        const segments = path.split('/').filter(p => p);
        const isSubPage = ['home', 'daily', 'evening', 'miniclub', 'team', 'admin'].some(dir => path.includes('/' + dir + '/'));
        return isSubPage ? '../' : './';
    }
};

// --- GLOBAL STABILITY GUARDS ---
window.addEventListener('unhandledrejection', (event) => {
    console.warn('AHC: Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
    // Silent catch for minor script failures to prevent app crash
    if (event.filename && event.filename.includes('weather.js')) {
        console.warn('AHC: Weather script minor failure.');
    }
});

// --- GLOBAL RENDER UTILS ---
const RenderUtils = {
    getSkeletonCards(count = 3) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton-loader"></div>`;
        }
        return html;
    },

    renderCard(item) {
        const title = I18n.getT('act.' + item.title) || item.title;
        const isNotified = AppState.notifications.includes(item.id);
        const isFavorite = AppState.favorites.includes(item.id);

        return `
            <div class="program-card scroll-reveal">
                <div class="program-time"><i class="ph ph-clock"></i> ${item.time}</div>
                <div class="program-icon-large"><i class="ph ${item.icon}"></i></div>
                <div class="program-details">
                    <h3 class="font-headline font-bold uppercase">${title}</h3>
                    ${item.loc ? `<p class="font-body text-dim location-tag" onclick="LocationMap.show('${item.loc}')" style="cursor:pointer;"><i class="ph ph-map-pin"></i> ${I18n.getT('loc.' + item.loc)}</p>` : ''}
                    
                    <div class="program-card-actions" style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <button onclick="AppActions.toggleFavorite(${item.id})" class="bell-btn ${isFavorite ? 'active' : ''}" style="${isFavorite ? 'color: var(--primary);' : ''}">
                            <i class="ph ${isFavorite ? 'ph-heart-fill' : 'ph-heart'}"></i>
                        </button>
                        <button onclick="AppActions.toggleNotification(${item.id})" class="bell-btn ${isNotified ? 'active' : ''}">
                            <i class="ph ph-bell"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

window.RenderUtils = RenderUtils;

// --- COMPONENT RENDERER ---
const Components = {
    renderNav() {
        let header = document.getElementById('main-header');
        const existingNav = document.querySelector('nav.navbar');
        
        if (!header) {
            header = document.createElement('header');
            header.id = 'main-header';
            header.className = 'header-stack';
            document.body.prepend(header);
        }

        // If navbar exists outside header, move it in
        if (existingNav && existingNav.parentElement !== header) {
            header.appendChild(existingNav);
        }

        // Ensure navbar exists inside header
        let nav = header.querySelector('nav.navbar');
        if (!nav) {
            nav = document.createElement('nav');
            nav.className = 'navbar';
            header.appendChild(nav);
        }
        
        nav.innerHTML = `
            <div class="container flex justify-between items-center w-full" style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <a href="${AppState.getBasePath()}home/index.html" class="logo group flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none;">
                    <img src="${AppState.getBasePath()}assets/logo.png" style="height: 40px; border-radius: 8px;" alt="AHC">
                    <span class="font-headline font-bold text-2xl uppercase hidden sm:block">AHC TEAM</span>
                </a>

                <div class="hidden md:flex nav-links">
                    <a href="${AppState.getBasePath()}home/index.html" class="nav-link" data-target="home" data-i18n="nav.home"></a>
                    <a href="${AppState.getBasePath()}daily/index.html" class="nav-link" data-target="daily" data-i18n="nav.daily"></a>
                    <a href="${AppState.getBasePath()}evening/index.html" class="nav-link" data-target="evening" data-i18n="nav.evening"></a>
                    <a href="${AppState.getBasePath()}miniclub/index.html" class="nav-link" data-target="miniclub" data-i18n="nav.miniclub"></a>
                    <a href="${AppState.getBasePath()}team/index.html" class="nav-link" data-target="team" data-i18n="nav.team"></a>
                    <div class="lang-selector">
                        <select id="language-select">
                            <option value="tr">🇹🇷 TR</option>
                            <option value="en">🇺🇸 EN</option>
                            <option value="de">🇩🇪 DE</option>
                            <option value="bg">🇧🇬 BG</option>
                            <option value="fr">🇫🇷 FR</option>
                            <option value="pl">🇵🇱 PL</option>
                            <option value="ru">🇷🇺 RU</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-3 nav-actions" style="display: flex; align-items: center; gap: 0.75rem;">
                    <button id="mobile-menu-btn" class="md:hidden" style="background: none; border: none; color: white; cursor: pointer;">
                        <i class="ph ph-list" style="font-size: 2rem;"></i>
                    </button>
                </div>
            </div>

            <div id="mobile-menu">
                <div class="flex flex-col">
                    <a href="${AppState.getBasePath()}home/index.html" class="mobile-nav-link" data-target="home" data-i18n="nav.home"></a>
                    <a href="${AppState.getBasePath()}daily/index.html" class="mobile-nav-link" data-target="daily" data-i18n="nav.daily"></a>
                    <a href="${AppState.getBasePath()}evening/index.html" class="mobile-nav-link" data-target="evening" data-i18n="nav.evening"></a>
                    <a href="${AppState.getBasePath()}miniclub/index.html" class="mobile-nav-link" data-target="miniclub" data-i18n="nav.miniclub"></a>
                    <a href="${AppState.getBasePath()}team/index.html" class="mobile-nav-link" data-target="team" data-i18n="nav.team"></a>
                    
                    <div class="lang-selector-mobile">
                        <select id="language-select-mobile">
                            <option value="tr">TR - Türkçe</option>
                            <option value="en">EN - English</option>
                            <option value="de">DE - Deutsch</option>
                            <option value="bg">BG - Български</option>
                            <option value="fr">FR - Français</option>
                            <option value="pl">PL - Polski</option>
                            <option value="ru">RU - Русский</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    },

    renderFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;

        footer.innerHTML = `
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="flex flex-col" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem;">
                        <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="logo-icon" style="background: var(--primary); color: black; padding: 0.4rem 0.8rem; font-weight: 900; border-radius: 8px;">AHC</div>
                            <span class="font-headline font-bold text-2xl uppercase" style="color: white; font-weight: 900;">AHC TEAM</span>
                        </div>
                        <div class="signature">by MRDJKEREMCAN</div>
                    </div>
                    <p style="color: var(--text-dim); font-size: 0.9rem;" data-i18n="footer.desc"></p>
                </div>
                
                <div class="footer-links-grid">
                    <h4 style="color: white; font-weight: 800; margin-bottom: 2rem; text-transform: uppercase;" data-i18n="footer.links"></h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 1rem;">
                        <li><a href="${AppState.getBasePath()}daily/index.html" style="color: var(--text-dim); text-decoration: none;" data-i18n="footer.daily"></a></li>
                        <li><a href="${AppState.getBasePath()}evening/index.html" style="color: var(--text-dim); text-decoration: none;" data-i18n="footer.evening"></a></li>
                        <li><a href="${AppState.getBasePath()}miniclub/index.html" style="color: var(--text-dim); text-decoration: none;" data-i18n="nav.miniclub"></a></li>
                        <li><a href="${AppState.getBasePath()}team/index.html" style="color: var(--text-dim); text-decoration: none;" data-i18n="footer.team"></a></li>
                        <li><a href="${AppState.getBasePath()}admin/index.html" style="color: var(--primary); text-decoration: none; font-weight: 800; margin-top: 0.5rem; display: inline-block;" data-i18n="nav.admin"></a></li>
                    </ul>
                </div>

                <div class="footer-contact">
                    <h4 style="color: white; font-weight: 800; margin-bottom: 2rem; text-transform: uppercase;" data-i18n="footer.contact"></h4>
                    <p style="color: var(--text-dim); margin-bottom: 1rem;">@arte_leisure_group</p>
                    <a href="https://www.instagram.com/arte_leisure_group/" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 700;" data-i18n="footer.insta"></a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 6rem; padding-top: 3rem; border-top: 1px solid var(--border);">
                <p style="color: var(--text-dim); font-size: 0.8rem; letter-spacing: 0.2em; font-weight: 700;">
                    AHC TEAM &copy; 2026. <span data-i18n="footer.rights"></span>
                </p>
            </div>
        `;
    }
};

const Analytics = {
    trackView() {
        let path = window.location.pathname;
        if (path.endsWith('/') || path.endsWith('index.html')) {
            const segments = path.split('/').filter(s => s && s !== 'index.html');
            path = segments.pop() || 'home';
        } else {
            path = path.split('/').pop().replace('.html', '');
        }
        AppState.analytics.views[path] = (AppState.analytics.views[path] || 0) + 1;
        localStorage.setItem('ahc_analytics', JSON.stringify(AppState.analytics));
    }
};

const NotificationManager = {
    async requestPermission() {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        const permission = await Notification.requestPermission();
        return permission === "granted";
    },

    async send(title, body, icon) {
        if (!icon) icon = AppState.getBasePath() + 'assets/logo.png';
        if (Notification.permission === "granted") {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                reg.showNotification(title, {
                    body: body,
                    icon: icon,
                    badge: icon,
                    vibrate: [200, 100, 200],
                    data: { url: window.location.href }
                });
            } else {
                new Notification(title, { body, icon });
            }
        }
    },

    async test() {
        const granted = await this.requestPermission();
        if (granted) {
            this.send('AHC TEAM', I18n.getT('notif_hub.test_btn'));
        }
    },

    sentNotifications: JSON.parse(sessionStorage.getItem('ahc_sent_notifs') || '[]'),

    checkReminders() {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const currentTimeInMins = hour * 60 + min;
        const todayKey = `${now.toDateString()}_${hour}_${min}`;
        
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = days[now.getDay()];
        
        const filteredEvening = AppState.programs.evening.filter(p => !p.day || p.day === dayKey);

        const allPrograms = [
            ...AppState.programs.daily, 
            ...filteredEvening, 
            ...AppState.programs.miniclub,
            ...(AppState.programs.party || [])
        ];

        AppState.notifications.forEach(id => {
            const activity = allPrograms.find(p => p.id === id);
            if (!activity || !activity.time) return;

            const [h, m] = activity.time.split(':').map(Number);
            const startMins = h * 60 + m;
            const diff = startMins - currentTimeInMins;

            const notifKey = `${id}_${todayKey}`;
            // If we are within the reminder window and haven't sent this specific notification yet
            if (diff >= 0 && diff <= AppState.reminderTime && !this.sentNotifications.includes(notifKey)) {
                const title = I18n.getT('act.' + activity.title) || activity.title;
                const body = `${activity.time} - ${activity.desc || ''}`;
                this.send(`🔔 AHC TEAM: ${title}`, body);
                
                this.sentNotifications.push(notifKey);
                if (this.sentNotifications.length > 20) this.sentNotifications.shift();
                sessionStorage.setItem('ahc_sent_notifs', JSON.stringify(this.sentNotifications));
            }
        });
    }
};

const AppActions = {
    async toggleNotification(id) {
        const granted = await NotificationManager.requestPermission();
        if (!granted) return;

        if (AppState.notifications.includes(id)) {
            AppState.notifications = AppState.notifications.filter(n => n !== id);
        } else {
            AppState.notifications.push(id);
        }
        localStorage.setItem('ahc_notifs', JSON.stringify(AppState.notifications));
        if (window.renderPage) window.renderPage();
        NotificationHub.updateBadge();
        NotificationHub.renderModalList();
    },

    toggleFavorite(id) {
        Haptics.success();
        if (AppState.favorites.includes(id)) {
            AppState.favorites = AppState.favorites.filter(f => f !== id);
        } else {
            AppState.favorites.push(id);
        }
        localStorage.setItem('ahc_favorites', JSON.stringify(AppState.favorites));
        if (window.renderPage) window.renderPage();
        if (NotificationHub.modalOverlay && NotificationHub.modalOverlay.classList.contains('active')) {
            NotificationHub.renderModalList(); 
        }
    }
};

const NotificationHub = {
    init() {
        // Try to find the nav-actions container for placement
        const navActions = document.querySelector('.nav-actions');
        const btn = document.createElement('div');
        btn.className = 'notif-hub-btn';
        btn.id = 'notif-hub-btn';
        btn.innerHTML = `<i class="ph ph-bell"></i><div class="notif-badge" id="notif-badge-count">0</div>`;
        btn.onclick = () => this.toggleModal();
        
        if (navActions) {
            // Prepend so it appears before the mobile menu button
            navActions.prepend(btn);
        } else {
            document.body.appendChild(btn);
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'notif-modal-overlay';
        overlay.onclick = (e) => { if(e.target.id === 'notif-modal-overlay') this.toggleModal(); };
        
        overlay.innerHTML = `
            <div class="notif-modal">
                <div class="notif-modal-header">
                    <h3 data-i18n="notif_hub.title">Notification Center</h3>
                    <button onclick="NotificationHub.toggleModal()" class="modal-close-btn"><i class="ph ph-x"></i></button>
                </div>
                <div class="notif-modal-tabs">
                    <button class="tab-btn active" onclick="NotificationHub.switchTab('notifs')" id="tab-btn-notifs">
                        <i class="ph ph-bell"></i> <span data-i18n="notif_hub.notifs">Bildirimler</span>
                    </button>
                    <button class="tab-btn" onclick="NotificationHub.switchTab('favs')" id="tab-btn-favs">
                        <i class="ph ph-heart"></i> <span data-i18n="notif_hub.favs">Planım</span>
                    </button>
                </div>
                <div class="notif-modal-content">
                    <div id="notif-tab-content-wrapper">
                        <div id="notif-settings-panel" class="notif-settings">
                            <label data-i18n="notif_hub.reminder_label">Reminder Time</label>
                            <select class="notif-select" id="notif-time-select" onchange="NotificationHub.updateSettings()">
                                <option value="5" ${AppState.reminderTime === 5 ? 'selected' : ''} data-i18n="notif_hub.five_min">5 Mins Before</option>
                                <option value="15" ${AppState.reminderTime === 15 ? 'selected' : ''} data-i18n="notif_hub.fifteen_min">15 Mins Before</option>
                                <option value="30" ${AppState.reminderTime === 30 ? 'selected' : ''} data-i18n="notif_hub.thirty_min">30 Mins Before</option>
                            </select>
                            <button class="primary-btn test-btn" onclick="NotificationManager.test()" data-i18n="notif_hub.test_btn">Test Notif</button>
                        </div>
                        <div id="notif-list"></div>
                        <div class="setup-guide-box">
                            <h4 data-i18n="notif_hub.setup_guide"><i class="ph ph-info"></i> How to receive?</h4>
                            <div class="guide-text">
                                <p data-i18n="notif_setup.ios"></p>
                                <p data-i18n="notif_setup.android"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.modalOverlay = overlay;
        document.body.appendChild(overlay);
        this.updateBadge();
    },

    toggleModal() {
        const overlay = document.getElementById('notif-modal-overlay');
        overlay.classList.toggle('active');
        if (overlay.classList.contains('active')) {
            this.currentTab = 'notifs'; // Reset to default
            this.switchTab('notifs');
            I18n.apply();
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        const btnNotifs = document.getElementById('tab-btn-notifs');
        const btnFavs = document.getElementById('tab-btn-favs');
        const settings = document.getElementById('notif-settings-panel');

        if (btnNotifs) btnNotifs.classList.toggle('active', tab === 'notifs');
        if (btnFavs) btnFavs.classList.toggle('active', tab === 'favs');
        
        if (settings) {
            settings.style.display = tab === 'notifs' ? 'block' : 'none';
        }
        
        this.renderModalList();
    },

    updateSettings() {
        const val = document.getElementById('notif-time-select').value;
        AppState.reminderTime = parseInt(val);
        localStorage.setItem('ahc_reminder_time', val);
    },

    updateBadge() {
        const count = AppState.notifications.length;
        const badge = document.getElementById('notif-badge-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    renderModalList() {
        const container = document.getElementById('notif-list');
        if (!container) return;

        const isFavs = this.currentTab === 'favs';
        const sourceList = isFavs ? AppState.favorites : AppState.notifications;

        if (sourceList.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-dim); padding:2rem;" data-i18n="notif_hub.empty"></p>`;
            return;
        }

        const now = new Date();
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[now.getDay()];
        const filteredEvening = AppState.programs.evening.filter(p => !p.day || p.day === today);

        const allPrograms = [
            ...AppState.programs.daily, 
            ...filteredEvening, 
            ...AppState.programs.miniclub,
            ...(AppState.programs.party || [])
        ];

        container.innerHTML = sourceList.map(id => {
            const p = allPrograms.find(it => it.id === id);
            if (!p) return '';
            
            const actionBtn = isFavs 
                ? `<button class="remove-notif-btn" onclick="AppActions.toggleFavorite(${p.id})"><i class="ph ph-trash"></i></button>`
                : `<button class="remove-notif-btn" onclick="AppActions.toggleNotification(${p.id})"><i class="ph ph-trash"></i></button>`;

            return `
                <div class="notif-item">
                    <div class="notif-item-info">
                        <h4>${I18n.getT('act.' + p.title) || p.title}</h4>
                        <p>${p.time} | ${p.desc || ''}</p>
                    </div>
                    ${actionBtn}
                </div>
            `;
        }).join('');
        I18n.apply();
    }
};

window.NotificationHub = NotificationHub;

const LocationMap = {
    show(locKey) {
        Haptics.vibrate(20);
        let overlay = document.getElementById('loc-map-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.id = 'loc-map-overlay';
            overlay.onclick = (e) => { if(e.target.id === 'loc-map-overlay') overlay.classList.remove('active'); };
            
            overlay.innerHTML = `
                <div class="notif-modal popup-scale-in" style="text-align:center; padding: 2rem;">
                    <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">
                        <i class="ph ph-map-pin"></i>
                    </div>
                    <h3 id="loc-map-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Location</h3>
                    <p style="color: var(--text-dim); margin-bottom: 1.5rem;" data-i18n="map.guidance">Follow the signs inside the hotel to find this area.</p>
                    <button class="primary-btn" onclick="document.getElementById('loc-map-overlay').classList.remove('active')" style="width:100%;" data-i18n="map.coming_soon">Map (Coming Soon)</button>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        document.getElementById('loc-map-title').textContent = I18n.getT('loc.' + locKey) || locKey;
        setTimeout(() => overlay.classList.add('active'), 10);
    }
};
window.LocationMap = LocationMap;

const LiveBar = {
    index: 0,
    timer: null,

    start() {
        if (this.timer) return;
        this.timer = setInterval(() => {
            this.index = 1 - this.index;
            this.render();
        }, 10000);
    },

    render() {
        // Logic should ensure main-header exists, if not, wait for renderNav or create it
        let header = document.getElementById('main-header');
        if (!header) {
            Components.renderNav();
            header = document.getElementById('main-header');
        }
        
        let bar = document.getElementById('live-activity-bar');
        
        const now = new Date();
        const currentTimeMins = now.getHours() * 60 + now.getMinutes();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[now.getDay()];
        
        const filteredEvening = AppState.programs.evening.filter(p => !p.day || p.day === today);
        
        const allPrograms = [
            ...AppState.programs.daily, 
            ...filteredEvening, 
            ...AppState.programs.miniclub,
            ...(AppState.programs.party || [])
        ].filter(p => p.time && p.time !== 'OFF').sort((a, b) => {
            const timeA = a.time.includes(' - ') ? a.time.split(' - ')[0] : a.time;
            const timeB = b.time.includes(' - ') ? b.time.split(' - ')[0] : b.time;
            const [hA, mA] = timeA.split(':').map(Number);
            const [hB, mB] = timeB.split(':').map(Number);
            return (hA * 60 + mA) - (hB * 60 + mB);
        });

        const current = allPrograms.find(p => {
            if (!p.time) return false;
            if (p.time.includes(' - ')) {
                const [start, end] = p.time.split(' - ');
                return timeStr >= start && timeStr <= end;
            }
            const [h, m] = p.time.split(':').map(Number);
            const startMins = h * 60 + m;
            return currentTimeMins >= startMins && currentTimeMins < startMins + 45;
        });

        const upcoming = allPrograms.find(p => {
            if (!p.time) return false;
            const startTime = p.time.includes(' - ') ? p.time.split(' - ')[0] : p.time;
            const [h, m] = startTime.split(':').map(Number);
            const startMins = h * 60 + m;
            return startMins > currentTimeMins;
        });

        let isCyclingAllowed = true;
        if (current) {
            const startTime = current.time.includes(' - ') ? current.time.split(' - ')[0] : current.time;
            const [h, m] = startTime.split(':').map(Number);
            const startMins = h * 60 + m;
            if (currentTimeMins < startMins + 30) {
                isCyclingAllowed = false;
            }
        }

        let target = current;
        let isNext = false;

        if (current && upcoming) {
            if (isCyclingAllowed) {
                target = this.index === 0 ? current : upcoming;
                isNext = (this.index === 1);
            } else {
                target = current;
                isNext = false;
                this.index = 0;
            }
        } else if (current) {
            target = current;
            isNext = false;
        } else if (upcoming) {
            target = upcoming;
            isNext = true;
        }
        
        if (!target) {
            if (bar) bar.remove();
            requestAnimationFrame(() => header.style.setProperty('--header-height', header.offsetHeight + 'px'));
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'live-activity-bar';
            header.prepend(bar);
        }

        const title = I18n.getT('act.' + target.title) || target.title;
        const barContentId = `${target.id}_${isNext}`;
        
        // Only trigger "Island Expansion" animation if content actually changed
        if (bar.dataset.contentId !== barContentId) {
            bar.classList.add('expanded');
            setTimeout(() => bar.classList.remove('expanded'), 4000);
            bar.dataset.contentId = barContentId;
        }
        
        bar.className = 'live-bar ' + (isNext ? 'upcoming' : 'live');
        let statusHtml = '';

        if (!isNext) {
            statusHtml = `
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    <span class="live-tag">${I18n.getT('live_bar.live') || 'LIVE'}</span>
                </div>`;
        } else {
            const startTime = target.time.includes(' - ') ? target.time.split(' - ')[0] : target.time;
            const [h, m] = startTime.split(':').map(Number);
            const diff = (h * 60 + m) - currentTimeMins;
            const label = diff > 0 && diff <= 60 ? `${diff} ${I18n.getT('live_bar.mins_left')}` : I18n.getT('live_bar.next');
            statusHtml = `
                <div class="live-indicator">
                    <i class="ph ph-hourglass-high"></i>
                    <span class="live-tag">${label}</span>
                </div>`;
        }

        bar.innerHTML = `
            ${statusHtml}
            <div class="live-content" style="animation: slideInBar 0.5s ease-out;">
                <span class="live-text">${title}</span>
                <span class="live-time"><i class="ph ph-clock"></i> ${target.time}</span>
            </div>
        `;

        requestAnimationFrame(() => {
            header.style.setProperty('--header-height', header.offsetHeight + 'px');
        });
    }
};

// --- LUXURY ENHANCEMENTS ---
const Luxury = {
    audioCtx: null,
    init() {
        this.initCursor();
        this.initTilt();
        this.initTheme();
        this.initAudio();
        this.initParallax();
    },
    initCursor() {
        if (window.matchMedia("(pointer: coarse)").matches) return; // Ignore on touch
        const ring = document.createElement('div');
        ring.className = 'cursor-ring';
        document.body.appendChild(ring);
        let mX = 0, mY = 0, rX = 0, rY = 0;
        document.addEventListener('mousemove', (e) => { mX = e.clientX; mY = e.clientY; });
        const animate = () => {
            rX += (mX - rX - 20) * 0.15;
            rY += (mY - rY - 20) * 0.15;
            ring.style.transform = `translate3d(${Math.round(rX)}px, ${Math.round(rY)}px, 0)`;
            requestAnimationFrame(animate);
        };
        animate();
        document.querySelectorAll('a, button, .interactive, .program-card, .team-card').forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('active'));
            el.addEventListener('mouseleave', () => ring.classList.remove('active'));
        });
    },
    initTilt() {
        const selector = '.program-card, .feature-card, .team-card, .notif-hub-btn';
        document.addEventListener('mousemove', (e) => {
            const el = e.target.closest(selector);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const rx = (y - rect.height/2) / 10, ry = (rect.width/2 - x) / 10;
            el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        document.addEventListener('mouseout', (e) => {
            const el = e.target.closest(selector);
            if (el) el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    },
    initTheme() {
        const hour = new Date().getHours();
        const body = document.body;
        body.classList.remove('theme-morning', 'theme-noon', 'theme-evening', 'theme-night');
        if (hour >= 5 && hour < 11) body.classList.add('theme-morning');
        else if (hour >= 11 && hour < 17) body.classList.add('theme-noon');
        else if (hour >= 17 && hour < 21) body.classList.add('theme-evening');
        else body.classList.add('theme-night');
    },
    initAudio() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('button, a, .interactive')) this.playTick();
        }, true);
    },
    playTick() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.05);
    },
    initParallax() {
        const container = document.createElement('div');
        container.className = 'parallax-container';
        for (let i = 0; i < 30; i++) {
            const atom = document.createElement('div');
            atom.className = 'atom';
            atom.style.left = Math.random() * 100 + '%'; atom.style.top = Math.random() * 100 + '%';
            atom.dataset.speed = Math.random() * 0.05 + 0.02;
            container.appendChild(atom);
        }
        document.body.appendChild(container);
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            document.querySelectorAll('.atom').forEach(atom => {
                atom.style.transform = `translateY(${scrolled * atom.dataset.speed}px)`;
            });
        });
    }
};

// --- CORE STATE & UI ---
const UI = {
    navLinks: null,
    langSelects: null,
    mobileMenu: null,
    mobileMenuBtn: null
};

// --- I18N MODULE ---
const I18n = {
    getT(path) {
        const keys = path.split('.');
        let res = translations[AppState.currentLang] || translations['en'];
        for (let k of keys) { if (!res || !res[k]) return path; res = res[k]; }
        return res;
    },
    apply(animate = false) {
        if (animate) {
            document.body.classList.add('lang-blur-anim');
            setTimeout(() => this._applyDOM(), 150);
            setTimeout(() => document.body.classList.remove('lang-blur-anim'), 300);
        } else this._applyDOM();
    },
    _applyDOM() {
        try {
            document.documentElement.lang = AppState.currentLang;
            if (UI.langSelects) UI.langSelects.forEach(s => { if(s) s.value = AppState.currentLang; });
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const t = this.getT(el.getAttribute('data-i18n'));
                if (t && t !== el.getAttribute('data-i18n')) el.textContent = t;
            });
            document.querySelectorAll('[data-i18n-holder]').forEach(el => {
                const t = this.getT(el.getAttribute('data-i18n-holder'));
                if (t && t !== el.getAttribute('data-i18n-holder')) el.placeholder = t;
            });
            if (LiveBar.render) LiveBar.render();
            if (window.renderPage) window.renderPage();
        } catch (e) {
            console.error("AHC I18n Apply Fail:", e);
        }
    }
};

window.AppActions = AppActions;

// --- NAVIGATION ---
function navigate(targetId) {
    Haptics.vibrate(30);
    const base = AppState.getBasePath();
    const map = {
        'home': `${base}home/index.html`, 'daily': `${base}daily/index.html`,
        'evening': `${base}evening/index.html`, 'miniclub': `${base}miniclub/index.html`,
        'login': `${base}admin/index.html`, 'dashboard': `${base}admin/index.html`, 'team': `${base}team/index.html`
    };
    if (map[targetId]) PageTransition.play(() => window.location.href = map[targetId]);
}

function saveData() {
    Storage.set('ahc_programs', AppState.programs);
    Storage.set('ahc_team', AppState.team);
    Storage.set('ahc_analytics', AppState.analytics);
}

window.navigate = navigate;
window.saveData = saveData;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    Components.renderNav();
    Components.renderFooter();
    NotificationHub.init();

    // Cache UI
    UI.navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    UI.langSelects = [document.getElementById('language-select'), document.getElementById('language-select-mobile')];
    UI.mobileMenu = document.getElementById('mobile-menu');
    UI.mobileMenuBtn = document.getElementById('mobile-menu-btn');

    UI.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (UI.mobileMenu) UI.mobileMenu.classList.remove('active');
            PageTransition.play(() => window.location.href = link.href);
        });
    });

    if (UI.mobileMenuBtn) UI.mobileMenuBtn.addEventListener('click', () => UI.mobileMenu.classList.toggle('active'));

    UI.langSelects.forEach(s => {
        if (!s) return;
        s.addEventListener('change', (e) => {
            AppState.currentLang = e.target.value;
            Storage.set('ahc_lang', AppState.currentLang);
            I18n.apply(true);
        });
    });

    // Highlighting
    const segments = window.location.pathname.split('/').filter(p => p);
    let currentPage = segments.pop() || 'home';
    if (currentPage === 'index.html') currentPage = segments.pop() || 'home';
    UI.navLinks.forEach(link => {
        const target = link.dataset.target;
        if (target === currentPage || (currentPage === 'admin' && (target === 'login' || target === 'dashboard'))) {
            link.classList.add('active');
        } else link.classList.remove('active');
    });

    try {
        I18n.apply();
        Analytics.trackView();
        // Wait slightly for layout to settle before init Luxury (prevents jitter)
        setTimeout(() => {
            Luxury.init();
            LiveBar.start();
            if (window.Weather) window.Weather.init();
        }, 300);
        setInterval(() => NotificationManager.checkReminders(), 60000);
        window.addEventListener('resize', () => {
            const h = document.getElementById('main-header');
            if (h) h.style.setProperty('--header-height', h.offsetHeight + 'px');
        });
        NotificationManager.checkReminders();
    } catch (e) { /* AHC Init Error */ }
    document.body.style.opacity = '1';
});

// --- SW REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const base = AppState.getBasePath();
        navigator.serviceWorker.register(base + 'sw.js')
            .catch(() => { });
    });
}
