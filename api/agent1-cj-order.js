// nexo – Agente 1 CJ Dropshipping order bridge
// Usa CJ_API_KEY para obtener token automáticamente y preparar la orden real CJ.
// El débito real al cliente se confirma por pasarela (PayPal/Stripe/ACH); luego Agente 1 usa este puente.
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
function money(n){ return Number(Number(n || 0).toFixed(2)); }
async function getCjToken(){
  if(process.env.CJ_ACCESS_TOKEN) return process.env.CJ_ACCESS_TOKEN;
  const apiKey = (process.env.CJ_API_KEY || '').trim();
  if(!apiKey) return '';
  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({apiKey})
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok || data.result === false) throw new Error(data.message || 'CJ token failed');
  return data?.data?.accessToken || data?.data?.access_token || data?.accessToken || '';
}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET'){
    try{ const token = await getCjToken(); return res.status(200).json({ok:true, service:'agent1-cj-order', cjConfigured:Boolean(token), mode: token?'cj_token_ok':'missing_cj_api_key'}); }
    catch(e){ return res.status(500).json({ok:false, service:'agent1-cj-order', error:e.message||String(e)}); }
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const order = req.body || {};
    const token = await getCjToken();
    const items = Array.isArray(order.items) ? order.items : [];
    const cjItems = items.filter(i=>String(i.provider || i.proveedor || '').toLowerCase().includes('cj'));
    const subtotal = money(order.subtotal || items.reduce((s,i)=>s+money(i.price)*Number(i.quantity||1),0));
    const shipping = money(order.amazonShipping || items.reduce((s,i)=>s+money(i.cjShippingCost ?? i.shippingAmazon ?? i.shippingCost)*Number(i.quantity||1),0));
    const vendorFees = money(order.vendorFees || items.reduce((s,i)=>s+money(i.cjHandlingFee ?? i.vendorFee ?? i.handlingFee)*Number(i.quantity||1),0));
    const commission = money(order.commission || subtotal*.30);
    const total = money(subtotal + shipping + vendorFees + commission);
    // Preparación CJ: todavía NO se envía la compra si el pago no llega capturado desde pasarela/webhook.
    // Cuando estado_pago === capturado, agent1-procesar llama este endpoint y registra la orden lista.
    return res.status(200).json({
      ok:true, provider:'CJ Dropshipping', cjToken:Boolean(token),
      mode: token ? 'cj_api_ready_order_prepared' : 'missing_cj_api_key',
      estado: token ? 'orden_cj_lista_para_envio_api' : 'pendiente_configurar_cj',
      message: token ? 'Agente 1 tiene token CJ y puede preparar la orden con datos del cliente.' : 'Falta CJ_API_KEY/CJ_ACCESS_TOKEN.',
      totals:{subtotal, shipping, vendorFees, commission, total},
      customer: order.customer || {}, cjItems,
      next: 'capturar_pago_real_y_crear_orden_cj'
    });
  }catch(e){ return res.status(500).json({ok:false,error:e.message||String(e)}); }
}
