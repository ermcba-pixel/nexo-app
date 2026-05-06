(function(){
  const LINKS = {
    legal:'aviso-legal.html', terms:'terminos-condiciones.html', privacy:'politica-privacidad.html', cookies:'politica-cookies.html', refunds:'reembolsos.html'
  };
  const T = {
    es:{
      line1:'nexo – Plataforma Internacional de Intermediación Comercial',
      line2:'nexo Servicios Generales y Empresariales – NIT: 774651015 – Bolivia',
      line3:'nexo™ actúa exclusivamente como intermediario entre el cliente y proveedores internacionales.',
      line4:'© 2026 nexo™ – Todos los derechos reservados',
      legal:'Aviso Legal', terms:'Términos y Condiciones', privacy:'Privacidad', cookies:'Cookies', refunds:'Reembolsos'
    },
    en:{
      line1:'nexo – International Commercial Intermediation Platform',
      line2:'nexo Servicios Generales y Empresariales – Tax ID/NIT: 774651015 – Bolivia',
      line3:'nexo™ acts exclusively as an intermediary between the customer and international providers.',
      line4:'© 2026 nexo™ – All rights reserved',
      legal:'Legal Notice', terms:'Terms and Conditions', privacy:'Privacy', cookies:'Cookies', refunds:'Refunds'
    },
    pt:{
      line1:'nexo™ – Plataforma de intermediação comercial internacional',
      line2:'nexo Servicios Generales y Empresariales – NIT: 774651015 – Bolívia',
      line3:'nexo™ atua exclusivamente como intermediário entre o cliente e fornecedores internacionais.',
      line4:'© 2026 nexo™ – Todos os direitos reservados',
      legal:'Aviso Legal', terms:'Termos e Condições', privacy:'Privacidade', cookies:'Cookies', refunds:'Reembolsos'
    },
    it:{
      line1:'nexo – Piattaforma Internazionale di Intermediazione Commerciale',
      line2:'nexo Servicios Generales y Empresariales – NIT: 774651015 – Bolivia',
      line3:'nexo™ agisce esclusivamente come intermediario tra il cliente e fornitori internazionali.',
      line4:'© 2026 nexo™ – Tutti i diritti riservati',
      legal:'Avviso Legale', terms:'Termini e Condizioni', privacy:'Privacy', cookies:'Cookie', refunds:'Rimborsi'
    },
    fr:{
      line1:'nexo – Plateforme Internationale d’Intermédiation Commerciale',
      line2:'nexo Servicios Generales y Empresariales – NIT : 774651015 – Bolivie',
      line3:'nexo™ agit exclusivement comme intermédiaire entre le client et les fournisseurs internationaux.',
      line4:'© 2026 nexo™ – Tous droits réservés',
      legal:'Mentions légales', terms:'Conditions générales', privacy:'Confidentialité', cookies:'Cookies', refunds:'Remboursements'
    }
  };
  function norm(v){
    v=(v||'es').toString().toLowerCase();
    if(['es','en','pt','it','fr'].includes(v)) return v;
    if(v.includes('eng')||v.includes('ing')) return 'en';
    if(v.includes('port')) return 'pt';
    if(v.includes('ital')) return 'it';
    if(v.includes('fran')) return 'fr';
    return 'es';
  }
  function lang(){ return norm(localStorage.getItem('nexoLang') || localStorage.getItem('nexo_language') || document.documentElement.lang || 'es'); }
  function html(t){
    return `<strong>${t.line1.replace('nexo™','nexo™')}</strong><br>`+
      `${t.line2}<br>`+
      `${t.line3}<br>`+
      `${t.line4}<br>`+
      `<div class="nexo-legal-links" style="margin-top:10px;display:flex;flex-wrap:wrap;justify-content:center;gap:0;align-items:center;">`+
      `<a href="${LINKS.legal}">${t.legal}</a><span>&nbsp;|&nbsp;</span>`+
      `<a href="${LINKS.terms}">${t.terms}</a><span>&nbsp;|&nbsp;</span>`+
      `<a href="${LINKS.privacy}">${t.privacy}</a><span>&nbsp;|&nbsp;</span>`+
      `<a href="${LINKS.cookies}">${t.cookies}</a><span>&nbsp;|&nbsp;</span>`+
      `<a href="${LINKS.refunds}">${t.refunds}</a>`+
      `</div>`;
  }
  function apply(){
    const t=T[lang()]||T.es;
    document.documentElement.lang=lang();
    document.querySelectorAll('.nexo-left-legal,.nexo-legal-footer,#nexo-legal-footer,[data-nexo-legal-footer]').forEach(el=>{
      el.setAttribute('data-nexo-legal-footer','1');
      el.innerHTML=html(t);
    });
    document.querySelectorAll('.nexo-legal-links a').forEach(a=>{ a.style.color='inherit'; a.style.textDecoration='underline'; a.style.fontWeight='700'; });
  }
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('pageshow', apply);
  window.addEventListener('storage', apply);
  document.addEventListener('click', function(e){
    const b=e.target.closest('[data-lang],.lang-btn,.language-btn,button');
    if(b) setTimeout(apply, 80);
  }, true);
  let last='';
  setInterval(()=>{ const now=lang(); if(now!==last){ last=now; apply(); } }, 350);
  window.nexoApplyLegalFooterLanguage=apply;
})();
