
const SUPABASE_URL = "https://ujqbbnipftlzytdankwp.supabase.co";
const SUPABASE_KEY = "sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv";
const NEXO_PAYPAL_EMAIL = "ermcba@hotmail.com";
let nexoSupabase = null;
function initNexoSupabase(){
  if (nexoSupabase) return nexoSupabase;
  if (!window.supabase || !window.supabase.createClient) { console.warn('Supabase no cargó. El pedido continuará con respaldo local.'); return null; }
  nexoSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  window.nexoSupabase = nexoSupabase;
  return nexoSupabase;
}
window.nexoSavePedidoToSupabase = async function(orderData){
  const client = initNexoSupabase();
  if (!client) return { data: { id: orderData.id || ('LOCAL-' + Date.now()), local_only: true }, error: null };
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const firstItem = items[0] || {};
  const customer = orderData.customer || {};
  const parts = String(orderData.fullName || '').trim().split(/\s+/);
  const clienteNombre = parts.shift() || '';
  const clienteApellido = parts.join(' ');
  const metodo = orderData.paymentMethod || 'card';
  const facturaNum = orderData.factura_numero || ('NEXO-FISC-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-8));
  orderData.factura_numero = facturaNum;
  const row = {
    cliente_email: orderData.email || customer.email || '',
    cliente_nombre: clienteNombre, cliente_apellido: clienteApellido, cliente_documento: customer.documentId || '',
    cliente_telefono: customer.phone || orderData.phone || '', cliente_pais: customer.country || orderData.country || '', cliente_ciudad: customer.city || orderData.city || '', cliente_direccion: customer.address || orderData.address || '',
    producto: items.map(i => `${i.name || i.nombre || i.producto || 'Producto nexo™'} x${i.quantity || i.cantidad || 1}`).join(' | '),
    producto_url: (window.nexoEnsureAmazonAffiliateUrl ? window.nexoEnsureAmazonAffiliateUrl((firstItem.sourceUrl || firstItem.url || firstItem.link || ''), firstItem.name || firstItem.nombre || firstItem.producto || '') : (firstItem.sourceUrl || firstItem.url || firstItem.link || '')), producto_nombre: firstItem.name || firstItem.nombre || firstItem.producto || 'Pedido nexo™', proveedor: firstItem.provider || firstItem.vendor || firstItem.proveedor || 'Marketplace externo',
    cantidad: items.reduce((n,i)=>n+Number(i.quantity || i.cantidad || 1),0) || 1, precio_usd: Number(orderData.total || 0), costo_producto_usd: Number(orderData.subtotal || 0), costo_envio_usd: Number(orderData.amazonShipping || 0),
    comision_nexo_usd: Number(orderData.commission || 0), impuesto_it_usd: Number(orderData.itf || 0), impuesto_iue_usd: Number(orderData.iue || 0), total_cliente_usd: Number(orderData.total || 0),
    moneda:'USD', metodo_pago: metodo, estado:'pendiente', estado_pago:'pendiente_confirmacion', estado_compra:'pendiente_agente_1', estado_envio:'pendiente', tracking:'',
    amazon_asin: firstItem.asin || firstItem.amazon_asin || '', amazon_tag: 'nexo08-20', factura_numero: facturaNum, courier: '', tracking_url: '', agente1_log: 'Pedido registrado para Agente 1 automático',
    fecha_estimada_entrega: orderData.deliveryEstimate || '', prioridad_envio: orderData.deliveryLabel || orderData.shippingPriority || '',
    observaciones: `Cobro principal PayPal (${NEXO_PAYPAL_EMAIL}). El total cobrado incluye precio proveedor + comisión nexo™ sobre precio proveedor + costos externos aplicables. ${orderData.note || ''}`.trim()
  };
  
  const inserted = await client.from('pedidos').insert([row]).select().single();
  if(!inserted.error && inserted.data){
    const pedidoId = inserted.data.id;
    const activeClientId = customer.id || orderData.cliente_id || null;
    const factura = row.factura_numero;
    try { await client.from('pagos').insert([{ pedido_id: pedidoId, cliente_id: activeClientId, metodo: metodo, estado: row.estado_pago, monto_usd: row.total_cliente_usd, moneda:'USD', paypal_order_id: orderData.paypalOrderId || orderData.paypal_order_id || '', paypal_capture_id: orderData.paypalCaptureId || orderData.paypal_capture_id || '', paypal_payer_id: orderData.paypalPayerId || orderData.paypal_payer_id || '' }]); } catch(e) { console.warn('pagos:', e); }
    try { await client.from('facturas').insert([{ pedido_id: pedidoId, cliente_id: activeClientId, numero_factura: factura, numero_fiscal: factura, cliente_nombre: (orderData.fullName || customer.fullName || '').trim(), cliente_documento: customer.documentId || '', total_usd: row.total_cliente_usd, metodo_pago: metodo, pdf_url:'', estado:'emitida' }]); } catch(e) { console.warn('facturas:', e); }
    try { await client.from('logs_agente1').insert([{ pedido_id: pedidoId, accion:'pedido_creado', estado:'pendiente_cobro_y_compra_amazon', detalle:'Pedido cerrado en nexo; Agente 1 debe cobrar vía PayPal Business, comprar en Amazon/proveedor y registrar tracking.' }]); } catch(e) { console.warn('logs_agente1:', e); }
    try { if(row.producto_url && /amazon\./i.test(row.producto_url)) await client.from('afiliados_amazon').insert([{ pedido_id: pedidoId, cliente_id: activeClientId, amazon_url: row.producto_url, amazon_asin: row.amazon_asin || '', amazon_tag:'nexo08-20', evento:'pedido_con_referencia_amazon' }]); } catch(e) { console.warn('afiliados_amazon:', e); }
  }
  return inserted;
};
window.nexoPrefillCheckoutFromSupabase = async function(){
  try{ const client=initNexoSupabase(); const email=(sessionStorage.getItem('clientEmail')||document.getElementById('email')?.value||'').trim(); if(!email)return; const {data,error}=await client.from('clientes').select('*').eq('email',email).maybeSingle(); if(error||!data)return; const set=(id,v)=>{const el=document.getElementById(id); if(el&&v!==undefined&&v!==null)el.value=v;}; const full=`${data.nombre||''} ${data.apellido||''}`.trim(); set('fullName',full); set('email',data.email||email); set('phoneCode',data.codigo_area||''); set('phoneNumber',data.telefono||''); set('region',data.region||''); set('city',data.ciudad||''); set('address',data.direccion||''); set('zipCode',data.codigo_postal||''); sessionStorage.setItem('nexoActiveClient', JSON.stringify({fullName:full,name:data.nombre||'',lastName:data.apellido||'',documentId:data.documento||'',email:data.email||email,country:data.pais||'',areaCode:data.codigo_area||'',phone:data.telefono||'',postalCode:data.codigo_postal||'',region:data.region||'',city:data.ciudad||'',address:data.direccion||''})); }catch(e){console.warn(e);}
};
window.addEventListener('DOMContentLoaded',()=>{try{initNexoSupabase();}catch(e){console.warn(e)} setTimeout(()=>window.nexoPrefillCheckoutFromSupabase?.(),400);});
