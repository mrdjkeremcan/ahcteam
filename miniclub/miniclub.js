// Mini Club uses centralized RenderUtils from core.js

window.renderPage = function() {
    const miniclubList = document.getElementById('miniclub-list');
    if (!miniclubList) return;

    miniclubList.innerHTML = RenderUtils.getSkeletonCards(3);

    setTimeout(() => {
        if (AppState.programs.miniclub) {
            miniclubList.innerHTML = AppState.programs.miniclub.map(RenderUtils.renderCard).join('') || `<p style="color:var(--text-dim); text-align:center; padding: 4rem;">${I18n.getT('program.no_results')}</p>`;
            ScrollAnim.init();
        }
    }, 400); // 400ms skeleton delay
};
