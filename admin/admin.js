/**
 * AHC TEAM - Admin Specific Logic
 */

// --- ADMIN STATE ---
let isEditMode = false;

// --- ACTIONS ---
function deleteProgram(id) {
    if (confirm(I18n.getT('admin.confirm_delete'))) {
        const type = AppState.currentAdminTab;
        if (type === 'team') {
            AppState.team = AppState.team.filter(m => m.id !== id);
        } else {
            AppState.programs[type] = AppState.programs[type].filter(p => p.id !== id);
        }
        saveData();
        window.renderPage();
    }
}

function editProgram(type, id) {
    const list = type === 'team' ? AppState.team : AppState.programs[type];
    const item = list.find(it => it.id == id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-type').value = type;
    
    // Trigger type change UI logic
    document.getElementById('p-type').dispatchEvent(new Event('change'));

    if (type === 'team') {
        document.getElementById('p-title').value = item.name;
        document.getElementById('t-role').value = item.role;
        document.getElementById('t-img').value = item.img;
    } else {
        document.getElementById('p-time').value = item.time;
        document.getElementById('p-title').value = item.title;
        document.getElementById('p-loc').value = item.loc;
        document.getElementById('p-icon').value = item.icon;
        
        if (type === 'evening') {
            document.getElementById('p-day').value = item.day;
            document.getElementById('day-select-group').style.display = 'block';
        } else {
            document.getElementById('day-select-group').style.display = 'none';
        }
    }

    document.getElementById('form-title').textContent = I18n.getT('admin.edit_title');
    document.getElementById('submit-p-btn').innerHTML = `<i class="ph ph-check-circle"></i> ${I18n.getT('admin.update_btn')}`;
    document.getElementById('cancel-edit-btn').style.display = 'block';
    window.scrollTo({ top: document.querySelector('.admin-panel-form').offsetTop - 100, behavior: 'smooth' });
}

function cancelEdit() {
    isEditMode = false;
    document.getElementById('admin-form').reset();
    document.getElementById('p-id').value = '';
    
    // Reset Labels & UI
    document.getElementById('form-title').textContent = I18n.getT('admin.add_title');
    const titleLabel = document.getElementById('title-label');
    if (titleLabel) {
        titleLabel.setAttribute('data-i18n', AppState.currentAdminTab === 'team' ? 'admin.form_name' : 'admin.form_title');
    }
    document.getElementById('submit-p-btn').innerHTML = `<i class="ph ph-plus-circle"></i> ${I18n.getT('admin.add_btn')}`;
    document.getElementById('cancel-edit-btn').style.display = 'none';
    
    const pType = document.getElementById('p-type');
    if (pType) pType.dispatchEvent(new Event('change'));
    
    I18n.apply();
}

function moveProgram(type, id, direction) {
    const list = type === 'team' ? AppState.team : AppState.programs[type];
    const index = list.findIndex(it => it.id === id);
    if ((index === 0 && direction === -1) || (index === list.length - 1 && direction === 1)) return;
    
    const targetIndex = index + direction;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    
    saveData();
    window.renderPage();
}

// --- RENDERING ---
window.renderPage = function() {
    const listContainer = document.getElementById('admin-list-container');
    const dashboard = document.getElementById('dashboard');
    const loginSec = document.getElementById('login');
    
    if (AppState.isAuthenticated) {
        if (loginSec) loginSec.classList.remove('active');
        if (dashboard) dashboard.classList.add('active');
        
        if (listContainer) {
            const type = AppState.currentAdminTab;
            if (type !== 'team' && type !== 'analytics' && !AppState.programs[type]) {
                AppState.programs[type] = [];
            }
            
            if (type === 'analytics') {
                renderAnalytics(listContainer);
                return;
            }

            const list = type === 'team' ? AppState.team : AppState.programs[type];
            listContainer.innerHTML = list.map(p => `
                <div class="admin-item fade-in">
                    <div class="admin-item-info">
                        <div class="admin-item-icon-box" ${type === 'team' ? 'style="border-radius: 50%; overflow: hidden;"' : ''}>
                            ${type === 'team' ? `<img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="ph ${p.icon}"></i>`}
                        </div>
                        <div class="admin-item-content">
                            <div>
                                <h4 style="display:inline;">${type === 'team' ? p.name : I18n.getT('act.' + p.title)}</h4>
                            </div>
                            <p>${p.time || ''} ${p.day ? '| ' + I18n.getT('days.' + p.day) : ''} ${p.loc ? '| ' + I18n.getT('loc.' + p.loc) : ''}</p>
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button onclick="moveProgram('${type}', ${p.id}, -1)" class="admin-action-btn"><i class="ph ph-caret-up"></i></button>
                        <button onclick="moveProgram('${type}', ${p.id}, 1)" class="admin-action-btn"><i class="ph ph-caret-down"></i></button>
                        <button onclick="editProgram('${type}', ${p.id})" class="admin-action-btn"><i class="ph ph-pencil-simple"></i></button>
                        <button onclick="deleteProgram(${p.id})" class="admin-action-btn danger"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            `).join('') || `<p style="color:var(--text-dim); text-align:center; padding: 2rem;">${I18n.getT('admin.empty_list')}</p>`;
        }
    } else {
        if (dashboard) dashboard.classList.remove('active');
        if (loginSec) loginSec.classList.add('active');
    }
};

function renderAnalytics(container) {
    const views = AppState.analytics.views;
    container.innerHTML = `
        <div class="analytics-panel fade-in" style="padding: 1rem;">
            <h4 style="color: white; margin-bottom: 2.5rem; text-transform: uppercase;" data-i18n="admin.page_popularity">${I18n.getT('admin.page_popularity')}</h4>
            ${Object.entries(views).length === 0 ? `<p style="color:var(--text-dim);" data-i18n="admin.no_data">${I18n.getT('admin.no_data')}</p>` : ''}
            ${Object.entries(views).map(([path, count]) => `
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem;">
                        <span style="color: white; font-weight: 700;">${path.toUpperCase()}</span>
                        <span style="color: var(--primary); font-weight: 800;">${count} ${I18n.getT('admin.views_label')}</span>
                    </div>
                    <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.05); border-radius: 100px; overflow: hidden;">
                        <div style="width: ${Math.min((count / 10) * 100, 100)}%; height: 100%; background: linear-gradient(90deg, var(--primary), #ff8f00);"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}


function exportData() {
    const exportContent = `/**
 * AHC TEAM - Default Data 
 * This file serves as the initial source of truth.
 * When you make changes in the Admin Panel, you can export them and replace this file.
 */

const DefaultData = ${JSON.stringify({ 
    programs: AppState.programs, 
    team: AppState.team,
    analytics: AppState.analytics
}, null, 4)};
`;
    const blob = new Blob([exportContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    a.click();
    URL.revokeObjectURL(url);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    // ...
    const pType = document.getElementById('p-type');
    if (pType) {
        pType.addEventListener('change', () => {
            const val = pType.value;
            const progFields = document.getElementById('prog-fields');
            const teamFields = document.getElementById('team-fields');
            const descGroup = document.getElementById('desc-group');
            const iconGroup = document.getElementById('icon-group');
            const titleLabel = document.getElementById('title-label');

            if (val === 'team') {
                progFields.style.display = 'none';
                teamFields.style.display = 'block';
                document.getElementById('loc-group').style.display = 'none';
                iconGroup.style.display = 'none';
                titleLabel.setAttribute('data-i18n', 'admin.form_name');
            } else {
                progFields.style.display = 'block';
                teamFields.style.display = 'none';
                document.getElementById('loc-group').style.display = 'block';
                iconGroup.style.display = 'block';
                titleLabel.setAttribute('data-i18n', 'admin.form_title');
                
                if (val === 'evening') {
                    document.getElementById('day-select-group').style.display = 'block';
                } else {
                    document.getElementById('day-select-group').style.display = 'none';
                }
            }
            I18n.apply();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const admins = { 'mrdjkeremcan': 'Krmcn2298', 'alican': 'ali4141' };

            if (admins[user] === pass) {
                AppState.isAuthenticated = true;
                sessionStorage.setItem('ahc_auth', 'true');
                window.renderPage();
                I18n.apply();
            } else {
                document.getElementById('login-error').textContent = I18n.getT('login.error_msg');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AppState.isAuthenticated = false;
            sessionStorage.removeItem('ahc_auth');
            window.renderPage();
            I18n.apply();
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    const adminForm = document.getElementById('admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('p-id').value;
            const type = document.getElementById('p-type').value;

            if (type === 'team') {
                const teamData = {
                    name: document.getElementById('p-title').value,
                    role: document.getElementById('t-role').value,
                    img: document.getElementById('t-img').value || 'https://via.placeholder.com/600'
                };

                if (id) {
                    const idx = AppState.team.findIndex(m => m.id == id);
                    if (idx !== -1) AppState.team[idx] = { ...AppState.team[idx], ...teamData };
                    cancelEdit();
                } else {
                    AppState.team.push({ id: Date.now(), ...teamData });
                    adminForm.reset();
                }
            } else {
                if (!AppState.programs[type]) AppState.programs[type] = [];
                const progData = {
                    day: type === 'evening' ? document.getElementById('p-day').value : null,
                    time: document.getElementById('p-time').value,
                    title: document.getElementById('p-title').value,
                    loc: document.getElementById('p-loc').value,
                    icon: document.getElementById('p-icon').value || 'ph-star'
                };

                if (id) {
                    const idx = AppState.programs[type].findIndex(p => p.id == id);
                    if (idx !== -1) AppState.programs[type][idx] = { ...AppState.programs[type][idx], ...progData };
                    cancelEdit();
                } else {
                    AppState.programs[type].push({ id: Date.now(), ...progData });
                    adminForm.reset();
                }
            }
            saveData();
            window.renderPage();
            I18n.apply();
        });
    }

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            AppState.currentAdminTab = tab.dataset.type;
            localStorage.setItem('ahc_admin_tab', AppState.currentAdminTab);
            window.renderPage();
        });
    });

    const aiBtn = document.getElementById('ai-suggest-btn');
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            const title = document.getElementById('p-title').value;
            if (!title) return;
            // AI logic removed or simplified as p-desc is gone
            console.log('AI suggestion requested for:', title);
        });
    }

    // Expose globals for onclick
    window.deleteProgram = deleteProgram;
    window.editProgram = editProgram;
    window.moveProgram = moveProgram;
    window.cancelEdit = cancelEdit;
    window.exportData = exportData;
});
