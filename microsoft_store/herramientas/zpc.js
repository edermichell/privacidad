/* ===================== EDICIÓN PC (Microsoft Store / navegador): sin anuncios ni compras =====================
   Fuera de la app de Android no hay anuncios ni Google Play. Antes se veía un «anuncio» simulado de 5 s y una tienda
   «MODO DEMO» con compras de mentira. En la edición PC:
   · No hay anuncios: lo que en Android se gana viendo uno (caja extra, revivir, recuperar aliento, duplicar caja)
     se da directamente, con los MISMOS límites por día y tiempos de espera (el equilibrio del juego no cambia).
   · No hay compras: la tienda pasa a «Cajas y trajes»; los trajes premium (solo estética) vienen incluidos.
     El traje y las ventajas del Pack Fundador no.
   · «Privacidad» abre la política pública. */
const PCED = { on: !urNative() && !UR_SRVPAGE, url: 'https://edermichell.github.io/privacidad/' };
function pcTx(t) {
  return String(t == null ? '' : t)
    .replace(/ · VER ANUNCIO/g, '').replace(/ · ver anuncio/g, '')
    .replace(/Ver anuncio: \+1 caja/g, 'Caja extra gratis')
    .replace(/Hoy ya viste 3 anuncios/g, 'Hoy ya recogiste 3 cajas extra')
    .replace(/Espera (\d+) s para el siguiente anuncio/g, 'Espera $1 s para la siguiente recompensa')
    .replace(/Cargando anuncio…/g, '');
}
if (PCED.on) {
  demoAd = () => Promise.resolve({ ok: true });            /* sin anuncio: la recompensa llega al momento */
  monInterDue = () => false;                                 /* nunca hay anuncios entre partidas */
  MS.skins = true;                                           /* trajes premium incluidos (solo estética) */
  monPrivacy = () => { try { window.open(PCED.url, '_blank', 'noopener'); } catch (e) { typeof dbgc === 'function' && dbgc(e); } };
  monBuy = () => { }; monRestore = () => { };
  { const _sm = shopMsg; shopMsg = function (t) { return _sm.call(this, pcTx(t)); }; }
  { const _wl = s100WindLabel; s100WindLabel = function (t) { const r = _wl.call(this, t ? pcTx(t) : t); const b = $('bWindAd'), s = b && b.querySelector('span'); if (s) s.textContent = pcTx(s.textContent); return r; }; }
  { const _md = monDeath; monDeath = function () { const r = _md.apply(this, arguments); const s = $('bRevive') && $('bRevive').querySelector('span'); if (s && !MS.vip) s.textContent = 'REVIVIR (UNA VEZ POR PARTIDA)'; return r; }; }
  {
    const _rs = renderShop;
    renderShop = function () {
      const r = _rs.apply(this, arguments), el = $('shop'); if (!el || el.hidden) return r;
      try {
        const hd = el.querySelector('.ph b'), tag = el.querySelector('.ph span'); if (hd) hd.textContent = 'CAJAS Y TRAJES'; if (tag) tag.textContent = 'EDICIÓN PC';
        /* compras de Google Play y la tarjeta «Buen anfitrión» (se compra fuera): no existen en la edición PC */
        el.querySelectorAll('.prods').forEach(pr => { const h4 = pr.previousElementSibling; if (h4 && h4.tagName === 'H4') h4.remove(); pr.remove(); });
        el.querySelectorAll('[data-sh="restore"],[data-sh="skin"][data-id="fundador"]').forEach(b => b.remove());
        const pv = el.querySelector('[data-sh="privacy"]'); if (pv) pv.textContent = 'Privacidad';
        el.querySelectorAll('.shn').forEach(p => { if (/Modo demo/.test(p.textContent)) p.textContent = 'Edición PC: sin anuncios ni compras. Los trajes premium vienen incluidos.'; });
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { const t = pcTx(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
      } catch (e) { typeof dbgc === 'function' && dbgc(e); }
      return r;
    };
  }
  /* el botón TIENDA del menú y de la pausa */
  for (const id of ['bShop', 'bShopP']) { const b = $(id), s = b && b.querySelector('span'); if (s && s.firstChild && s.firstChild.nodeType === 3) s.firstChild.nodeValue = 'CAJAS'; }
  /* ayuda: la página de «gratis / tienda» describe la edición PC */
  { const hp = document.querySelector('.hp[data-t="5"]'); if (hp) hp.innerHTML = '<p><b>Edición PC: gratis, sin anuncios y sin compras.</b> El juego completo está incluido.</p><p><b>Cajas:</b> una <i>caja diaria</i> y hasta 3 cajas extra al día (Pausa → Cajas). Traen comida, medicina y munición.</p><p><b>Revivir:</b> al morir puedes volver una vez por partida con un poco de vida y protección breve.</p><p><b>Trajes:</b> los trajes premium (solo estética) vienen incluidos.</p>'; }
}
