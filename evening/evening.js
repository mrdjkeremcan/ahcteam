// Evening programs use centralized RenderUtils from core.js

window.renderPage = function() {
    const eveningList = document.getElementById('evening-list');
    if (!eveningList) return;

    eveningList.innerHTML = RenderUtils.getSkeletonCards(4);

    setTimeout(() => {
        if (AppState.programs.evening) {
            const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            let html = daysOrder.map(day => {
                const dayProgs = AppState.programs.evening.filter(p => p.day === day);
                if (dayProgs.length === 0) return '';
                return `
                    <div class="day-group fade-in">
                        <h3 class="day-title">${I18n.getT('days.' + day)}</h3>
                        <div class="day-list">${dayProgs.map(RenderUtils.renderCard).join('')}</div>
                    </div>
                `;
            }).join('');

            // Handle programs with no specific day
            const globalProgs = AppState.programs.evening.filter(p => !p.day);
            if (globalProgs.length > 0) {
                html += `
                    <div class="day-group fade-in">
                        <h3 class="day-title">${I18n.getT('evening.everyday')}</h3>
                        <div class="day-list">${globalProgs.map(RenderUtils.renderCard).join('')}</div>
                    </div>
                `;
            }

            eveningList.innerHTML = html || `<p style="color:var(--text-dim); text-align:center; padding: 4rem;">${I18n.getT('program.no_results')}</p>`;
            ScrollAnim.init();
        }
    }, 400); // 400ms skeleton delay
};
