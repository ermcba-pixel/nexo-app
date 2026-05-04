
function nexoPublicCleanup(){
  try{
    const keep = {
      nexoLang: localStorage.getItem('nexoLang'),
      nexo_language: localStorage.getItem('nexo_language')
    };
    const removeKeys = [
      'nexoClientProfile','nexoLastPurchase','nexoLastOrder','lastPurchase','nexoSupportTickets','nexoSupportTicketCounter','nexoAdminAccess','nexoAdminEmail'
    ];
    removeKeys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    if(keep.nexoLang) localStorage.setItem('nexoLang', keep.nexoLang);
    if(keep.nexo_language) localStorage.setItem('nexo_language', keep.nexo_language);
  }catch(e){}
}
document.addEventListener('DOMContentLoaded', nexoPublicCleanup);
