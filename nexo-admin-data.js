// nexo – Agente 1 Amazon shipping quote bridge
// Esta función recibe la dirección real del cliente y los ASIN/items.
// Producción debe enlazarse con Amazon Business Ordering/Cart API autorizada.

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const body=req.body || {};
  const address=body.address || body.customer || body.cliente || null;
  const items=Array.isArray(body.items) ? body.items : [];
  const ready=Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN);
  if(!address || !items.length){
    return res.status(400).json({ok:false,error:'Falta dirección cliente o productos Amazon.'});
  }
  return res.status(200).json({
    ok:true,
    mode: ready ? 'amazon_ordering_ready_pending_endpoint' : 'missing_amazon_ordering_env',
    agent:'Agente 1 Amazon',
    address,
    items,
    shippingAmazon:null,
    vendorFee:null,
    status:'pending_real_amazon_checkout_quote',
    message:'El Agente 1 ya recibe país, ciudad, código postal y dirección del cliente. El costo real debe ser devuelto por Amazon Business Ordering/Cart API en producción antes de confirmar el pedido.'
  });
}
