/* ============ Início ============ */
PHASES.forEach((P, i) => { P.n = i + 1; if (!P.kind) P.kind = '3d'; P.panel = () => { }; if (!P.drawInfo) P.drawInfo = () => HUD.refresh(); });
function openIntro(fromMenu) {
  const intro = $('#intro'); const slides = [...intro.querySelectorAll('.ob-slide')]; const dots = [...$('#obDots').children];
  let k = 0;
  const show = i => {
    k = clamp(i, 0, slides.length - 1);
    slides.forEach((s, j) => { s.hidden = j !== k; });
    dots.forEach((d, j) => d.classList.toggle('on', j <= k));
    $('#obBack').hidden = k === 0;
    $('#startBtn').textContent = k < slides.length - 1 ? 'Próximo' : (fromMenu ? 'Voltar ao jogo' : 'Começar a jogar');
    $('#obSkip').hidden = k === slides.length - 1;
    const c = intro.querySelector('.intro-card'); if (c) c.scrollTop = 0;
  };
  const finish = () => {
    intro.hidden = true;
    if (!S.started) { S.started = true; saveState(); }
    SND.ensure();
    if (E.pendingBrief) { const P = E.pendingBrief; E.pendingBrief = null; openBriefing(P, { auto: true, onClose: () => startPhaseTalk(P) }); }
  };
  $('#startBtn').onclick = () => { SND.play('click'); if (k < slides.length - 1) show(k + 1); else finish(); };
  $('#obBack').onclick = () => show(k - 1);
  $('#obSkip').onclick = finish;
  show(0); intro.hidden = false;
  setTimeout(() => $('#startBtn').focus({ preventScroll: true }), 50);
}
(async function boot() {
  if (!window.THREE) {
    document.body.append(h('div', { class: 'sheet pad', style: 'position:fixed;left:16px;right:16px;top:16px;z-index:99' }, h('b', null, 'Não foi possível carregar o jogo.'), h('p', { class: 'small' }, 'Verifique a conexão com a internet e recarregue a página.')));
    return;
  }
  paperGrain();
  loadState();
  if (!S.started) openIntro(false);
  try {
    await Promise.race([Promise.all([
      document.fonts.load(`700 28px ${FONT.body}`), document.fonts.load(`400 28px ${FONT.body}`),
      document.fonts.load('400 28px "Caveat Brush"'), document.fonts.load('700 28px "Caveat"'), document.fonts.load(`600 28px ${FONT.mono}`)]), wait(2500)]);
  } catch (e) { }
  initCore();
  $('#glossBtn').addEventListener('click', () => openGlossary());
  initHud(); watchReveal();
  refreshScore();
  go(clamp(S.phase || 0, 0, PHASES.length - 1));
  try { if (window.claude && typeof claude.use === 'function') claude.use('sample').then(s => { LIVE.sample = s || null; HUD.refresh(); }, () => { }); } catch (e) { }
})();
