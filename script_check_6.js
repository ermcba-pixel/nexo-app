
(function(){
  function nexoCheckoutLegalOk(){
    var cb=document.getElementById('nexoLegalAccept');
    if(cb && !cb.checked){ alert('Debes aceptar los términos legales de nexo™ para continuar.'); return false; }
    return true;
  }
  document.addEventListener('click', function(e){
    var el=e.target;
    if(!el) return;
    var txt=(el.textContent||el.value||'').toLowerCase();
    if((el.tagName==='BUTTON' || el.tagName==='A') && (txt.includes('pagar') || txt.includes('confirmar') || txt.includes('paypal'))){
      if(!nexoCheckoutLegalOk()){ e.preventDefault(); e.stopPropagation(); }
    }
  }, true);
})();
