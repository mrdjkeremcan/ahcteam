// Daily activities use centralized RenderUtils from core.js

window.renderPage = function() {
    const dailyList = document.getElementById('daily-list');
    const partyList = document.getElementById('party-list');
    const partySection = document.querySelector('#daily .section-header:nth-of-type(2)');

    // Show skeletons first
    if (dailyList) dailyList.innerHTML = RenderUtils.getSkeletonCards(3);
    if (partyList) partyList.innerHTML = RenderUtils.getSkeletonCards(1);

    setTimeout(() => {
        if (dailyList && AppState.programs.daily) {
            dailyList.innerHTML = AppState.programs.daily.map(RenderUtils.renderCard).join('') || 
                `<p style="color:var(--text-dim); text-align:center; padding: 2rem;">${I18n.getT('program.no_results')}</p>`;
        }
        
        if (partyList && AppState.programs.party) {
            const hasParty = AppState.programs.party.length > 0;
            if (partySection) partySection.style.display = hasParty ? 'block' : 'none';
            partyList.style.display = hasParty ? 'flex' : 'none';
            
            if (hasParty) {
                partyList.innerHTML = AppState.programs.party.map(RenderUtils.renderCard).join('');
            }
        }
        ScrollAnim.init();
    }, 400); // 400ms skeleton delay for premium feel
};
