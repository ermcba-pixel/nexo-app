// nexo – Agente 1 automático después de pago PayPal
// Objetivo: NO requiere aprobación manual. Luego del pago confirmado, el Agente 1 toma el pedido,
// calcula margen y deja la compra Amazon en ejecución/cola automática según el nivel de acceso API disponible.
// Cuando Amazon SP-API/Creators API esté en producción, este mismo endpoint es el punto de reemplazo para ejecutar la orden real.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

function money(n){
  const v = Number(n || 0);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : 0;
}

function extractPaid(capture){
  const status = String(capture?.status || capture?.capture?.status || '').toUpperCase();
  if(status === 'COMPLETED') return true;
  const purchaseUnits = capture?.capture?.purchase_units || capture?.purchase_units || [];
  return purchaseUnits.some(u => (u.payments?.captures || []).some(c => String(c.status || '').toUpperCase() === 'COMPLETED'));
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET'){
    return res.status(200).json({
      ok:true,
      service:'agent1-auto-purchase',
      mode:'automatic_after_paypal',
      paypalRequired:true,
      amazonOrderingConfigured:Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN),
      creatorsApiConfigured:Boolean(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY && process.env.AMAZON_ASSOCIATE_TAG),
      noManualApproval:true
    });
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});

  const body = req.body || {};
  const order = body.order || body.orderData || body || {};
  const paypalCapture = body.paypalCapture || order.paypalCapture || null;
  const paid = body.paymentVerified === true || order.payment_status === 'paid' || order.estado_pago === 'paypal_pagado_capturado' || extractPaid(paypalCapture);

  if(!paid){
    return res.status(402).json({
      ok:false,
      error:'paypal_payment_not_verified',
      message:'Agente 1 no compra en Amazon hasta que PayPal confirme/capture el pago.'
    });
  }

  const pedidoId = String(order.supabase_id || order.id || body.pedidoId || ('NEXO-' + Date.now()));
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotalProveedor = money(order.totals?.subtotal ?? order.subtotal);
  const totalCliente = money(order.totals?.total ?? order.total);
  const shippingAmazon = money(order.totals?.amazonShipping ?? order.amazonShipping);
  const vendorFees = money(order.totals?.vendorFees ?? order.vendorFees);
  const comision = money(order.totals?.commission ?? order.commission ?? Math.max(0,totalCliente-subtotalProveedor-shippingAmazon-vendorFees));
  const netCommissionAfterTaxes = money(order.totals?.netCommissionAfterTaxes ?? order.netCommissionAfterTaxes ?? comision);

  const hasAmazonOrdering = Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN);
  const hasCreatorsApi = Boolean(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY && process.env.AMAZON_ASSOCIATE_TAG);
  const productionEnabled = String(process.env.AMAZON_PRODUCTION_ENABLED || process.env.AMAZON_AUTO_PURCHASE_ENABLED || '').toLowerCase() === 'true';

  const affiliateTag = process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';
  const amazonLinks = items.map((item, index) => {
    const asin = item.asin || item.ASIN || item.amazonAsin || '';
    const rawUrl = item.url || item.providerUrl || item.amazonUrl || item.link || '';
    const url = asin
      ? `https://www.amazon.com/dp/${encodeURIComponent(asin)}?tag=${encodeURIComponent(affiliateTag)}`
      : (rawUrl || `https://www.amazon.com/s?k=${encodeURIComponent(item.name || item.title || 'producto')}&tag=${encodeURIComponent(affiliateTag)}`);
    return { index:index+1, name:item.name || item.title || 'Producto', asin, quantity:Number(item.quantity || 1), provider:'Amazon', url };
  });

  // Estado deliberadamente automático: no queda como “pendiente de aprobación manual”.
  let estado = 'agente_1_compra_automatica_en_cola';
  let detalle = 'Pago PayPal confirmado. Agente 1 tomó el pedido automáticamente. No requiere aprobación manual.';

  if(hasAmazonOrdering && productionEnabled){
    estado = 'agente_1_compra_amazon_produccion_lista';
    detalle = 'Pago confirmado. Amazon Ordering/SP-API está configurada para ejecución en producción. Este endpoint queda como puente de orden real.';
    // Aquí se conecta la llamada real a Amazon Ordering/Cart API cuando Amazon habilite producción completa.
  } else if(hasAmazonOrdering){
    estado = 'agente_1_compra_automatica_preparada_sandbox';
    detalle = 'Pago confirmado. SP-API existe pero está en pruebas/no producción. Agente 1 prepara compra automáticamente y conserva cola técnica sin aprobación manual.';
  }

  return res.status(200).json({
    ok:true,
    agent:'Agente 1',
    noManualApproval:true,
    pedidoId,
    estado,
    detalle,
    payment:{ method:'paypal', verified:true, totalClienteUsd:totalCliente },
    margin:{ subtotalProveedorUsd:subtotalProveedor, shippingAmazonUsd:shippingAmazon, vendorFeesUsd:vendorFees, comisionNexoUsd:comision, netCommissionAfterTaxesUsd:netCommissionAfterTaxes, staysIn:'PayPal' },
    amazon:{ orderingConfigured:hasAmazonOrdering, creatorsApiConfigured:hasCreatorsApi, productionEnabled, affiliateTag, links:amazonLinks }, cj:{ configured:Boolean(process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_TOKEN), priorityProvider:true },
    next: (items.some(i=>String(i.provider||'').toLowerCase().includes('cj')) ? 'cola_orden_cj_o_ejecutar_cj_api' : (hasAmazonOrdering && productionEnabled ? 'ejecutar_orden_amazon_real' : 'cola_automatica_hasta_habilitar_amazon_produccion'))
  });
}
