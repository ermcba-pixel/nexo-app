
window.addEventListener('DOMContentLoaded', () => {
  function nexoCustomerFinalCleanup(){
    // hide any lingering undefined rows anywhere
    document.querySelectorAll('div, p, span, strong').forEach(el=>{
      const t = (el.textContent || '').trim();
      if (/^undefined\s*:/i.test(t)) {
        const row = el.closest('.summary-row') || el.parentElement;
        if (row) row.remove(); else el.remove();
      }
    });

    // remove 35% if still printed in client summary/cart
    document.querySelectorAll('*').forEach(el=>{
      if (el.children.length === 0 && el.textContent) {
        el.textContent = el.textContent.replace(/\s*\(35%\)/g,'').replace(/\s*35%/g,'');
      }
    });

    // translatable delivery label in summary card
    const lang = localStorage.getItem('nexoLang') || localStorage.getItem('nexo_language') || 'es';
    const deliveryMap = {
      es: 'Entrega estimada',
      en: 'Estimated delivery',
      pt: 'Entrega estimada',
      it: 'Consegna stimata',
      fr: 'Livraison estimée'
    };
    const lbl = document.getElementById('sumDeliveryLbl');
    if (lbl) lbl.textContent = deliveryMap[lang] || deliveryMap.es;
  }
  setTimeout(nexoCustomerFinalCleanup, 50);
  setTimeout(nexoCustomerFinalCleanup, 250);
  setTimeout(nexoCustomerFinalCleanup, 800);
});
