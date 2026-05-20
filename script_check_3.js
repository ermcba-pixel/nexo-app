
function nexoHideInternalTaxesForCustomer(){
  const ids = ['sumItLbl','sumIueLbl','itf','iue','taxAmount','retentionAmount','taxSection'];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el) {
      const row = el.closest('.summary-row') || el.parentElement;
      if (row) row.style.display = 'none';
      else el.style.display = 'none';
    }
  });
  ['sumCommissionLbl'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){
      el.textContent = (el.textContent || '').replace(/\s*\(.*?\)/g,'').replace(/35%/g,'').replace(/30%/g,'').trim();
      if(!el.textContent.endsWith(':')) el.textContent = el.textContent.replace(/:?$/,'') + ':';
    }
  });
}
window.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(nexoHideInternalTaxesForCustomer, 50);
  setTimeout(nexoHideInternalTaxesForCustomer, 300);
});
