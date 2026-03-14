window.renderPage = function() {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid) return;

    // Premium skeleton delay
    teamGrid.innerHTML = `<div class="skeleton-loader" style="height: 400px; grid-column: 1/-1;"></div>`;

    setTimeout(() => {
        let html = AppState.team.map(m => `
            <div class="team-card fade-in">
                <div class="team-img-wrapper"><img src="${m.img}" alt="${m.name}"></div>
                <div class="team-info">
                    <span class="team-role uppercase">${I18n.getT('team.roles.' + m.role)}</span>
                    <h3 class="font-headline font-black text-2xl uppercase tracking-tighter" style="color:white;">${m.name}</h3>
                </div>
            </div>
        `).join('');

        teamGrid.innerHTML = html || `<p style="color:var(--text-dim); text-align:center; padding: 4rem; grid-column: 1/-1;">${I18n.getT('program.no_results')}</p>`;
        ScrollAnim.init();
    }, 400);
};

