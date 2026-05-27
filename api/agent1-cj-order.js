// nexo™ – Agente 1 CJ Dropshipping order bridge
// Recibe pedidos pagados y prepara la compra CJ con costos proveedor iguales a los del carrito.
// Con CJ_API_KEY, el backend puede obtener accessToken automáticamente.
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
function money(n){ return Number(Number(n || 0).toFixed(2)); }
async function getCjToken(){
  const manual=(process.env.CJ_ACCESS_TOKEN||process.env.CJ_API_TOKEN||'').trim();
  if(manual) return manual;
  const apiKey=(process.env.CJ_API_KEY||'').trim();
  if(!apiKey) return '';
  const r=await fetch(`${CJ_BASE}/authentication/getAccessToken`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey})});
  const data=await r.json().catch(()=>({}));
  return data?.data?.accessToken || data?.data?.access_token || data?.accessToken || '';
}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET'){
    const token = await getCjToken().catch(()=> '');
    return res.status(200).json({ok:true, service:'agent1-cj-order', cjConfigured:Boolean(process.env.CJ_API_KEY), tokenReady:Boolean(token), mode:'ready_for_cj'});
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const cjItems = items.filter(i=>String(i.provider || i.proveedor || '').toLowerCase().includes('cj')).map(i=>({
    cjProductId:i.cjProductId || i.pid || i.productId || '',
    sku:i.sku || i.productSku || i.id || '',
    name:i.name || i.nombre || '',
    quantity:Number(i.quantity || 1),
    productCost:money(i.cjProductCost ?? i.price),
    shippingCost:money(i.cjShippingCost ?? i.shippingAmazon ?? i.shippingCost),
    operatingCost:money(i.cjHandlingFee ?? i.vendorFee ?? i.handlingFee)
  }));
  const subtotal = money(order.subtotal || items.reduce((s,i)=>s+money(i.cjProductCost ?? i.price)*Number(i.quantity||1),0));
  const shipping = money(order.amazonShipping || items.reduce((s,i)=>s+money(i.cjShippingCost ?? i.shippingAmazon ?? i.shippingCost)*Number(i.quantity||1),0));
  const vendorFees = money(order.vendorFees || items.reduce((s,i)=>s+money(i.cjHandlingFee ?? i.vendorFee ?? i.handlingFee)*Number(i.quantity||1),0));
  const commission = money(order.commission || subtotal*.30);
  const total = money(subtotal + shipping + vendorFees + commission);
  const token = await getCjToken().catch(()=> '');
  const configured = Boolean(process.env.CJ_API_KEY && token);
  return res.status(200).json({
    ok:true,
    provider:'CJ Dropshipping',
    mode: configured ? 'cj_api_conectada_orden_real_pendiente_endpoint_cj' : 'cola_compra_cj_hasta_api_key_token',
    estado: configured ? 'pago_confirmado_cj_preparado' : 'pago_confirmado_cj_en_cola',
    message: configured ? 'Pago confirmado. Agente 1 tiene token CJ y deja orden preparada con costos CJ.' : 'Pago confirmado. Falta token/API CJ para crear orden automática.',
    totals:{subtotal, shipping, vendorFees, commission, total},
    cjItems,
    customer: order.customer || {},
    next: configured ? 'crear_orden_cj_con_endpoint_order_create' : 'verificar_CJ_API_KEY_en_Vercel'
  });
}
