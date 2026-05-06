
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({
    ok:true, service:'agent1-amazon', mode:'sandbox',
    ready:Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN)
  });
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const order = req.body || {};
  const clienteDestino = order.customer || order.cliente || order.shippingAddress || order.address || null;
  const items = Array.isArray(order.items) ? order.items : [];
  return res.status(200).json({
    ok:true,
    agent:'Agente 1 Amazon',
    mode:'sandbox',
    estado:'pedido_amazon_preparado_en_sandbox',
    clienteDestino,
    items,
    costos:'estimados_en_sandbox_no_finales',
    nota_costos:'Para costo real de envío, impuestos y cargos del proveedor, Agent 1 debe enviar país, ciudad, código postal y dirección exacta del cliente a Amazon Producción/Ordering API.',
    siguiente:'Producción Amazon Business: Product Search + Cart + Ordering API'
  });
}
