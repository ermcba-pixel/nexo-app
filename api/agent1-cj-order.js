// nexo – Agente 1 CJ Dropshipping order bridge
// Recibe pedidos pagados y los deja listos para orden CJ. Cuando existan CJ_ACCESS_TOKEN/CJ_API_BASE,
// este endpoint será el puente para crear la orden real en CJ.
function money(n){ return Number(Number(n || 0).toFixed(2)); }
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true, service:'agent1-cj-order', cjConfigured:Boolean(process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_TOKEN), mode:'ready_for_cj'});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const cjItems = items.filter(i=>String(i.provider || i.proveedor || '').toLowerCase().includes('cj'));
  const subtotal = money(order.subtotal || items.reduce((s,i)=>s+money(i.price)*Number(i.quantity||1),0));
  const shipping = money(order.amazonShipping || items.reduce((s,i)=>s+money(i.shippingAmazon || i.shippingCost)*Number(i.quantity||1),0));
  const vendorFees = money(order.vendorFees || items.reduce((s,i)=>s+money(i.vendorFee || i.handlingFee)*Number(i.quantity||1),0));
  const commission = money(order.commission || subtotal*.30);
  const total = money(subtotal + shipping + vendorFees + commission);
  const configured = Boolean(process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_TOKEN);
  return res.status(200).json({
    ok:true,
    provider:'CJ Dropshipping',
    mode: configured ? 'cj_api_configured_pending_production_order_call' : 'cola_compra_cj_hasta_token_api',
    estado: configured ? 'pedido_cj_preparado_api' : 'pedido_cj_preparado_manual_asistido',
    message: configured ? 'Pago confirmado. Agente 1 puede enviar esta orden a CJ con el endpoint oficial.' : 'Pago confirmado. Agente 1 deja la compra CJ en cola operativa hasta pegar token/API oficial.',
    totals:{subtotal, shipping, vendorFees, commission, total},
    cjItems,
    next: configured ? 'crear_orden_cj_api' : 'configurar_CJ_ACCESS_TOKEN_CJ_API_BASE_en_Vercel'
  });
}
