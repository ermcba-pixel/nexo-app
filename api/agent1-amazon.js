
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({
    ok:true, service:'agent1-amazon', mode:'amazon_business_bridge',
    ready:Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN)
  });
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const order = req.body || {};
  const clienteDestino = order.customer || order.cliente || order.shippingAddress || order.address || null;
  const items = Array.isArray(order.items) ? order.items : [];
  return res.status(200).json({
    ok:true,
    agent:'Agente 1 Amazon',
    mode:'amazon_business_bridge',
    estado:'pedido_amazon_preparado_para_cotizacion_real',
    clienteDestino,
    items,
    costos:'pendientes_de_cotizacion_real_amazon',
    nota_costos:'Para costo real de envío, impuestos y cargos del proveedor, el Agente 1 envía país, ciudad, código postal y dirección exacta del cliente a Amazon Business Ordering/Cart API.',
    siguiente:'Producción Amazon Business: Product Search + Cart + Ordering API'
  });
}
