
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
  const row = {
    cliente_email: orderData.email || customer.email || '',
    cliente_nombre: clienteNombre, cliente_apellido: clienteApellido, cliente_documento: customer.documentId || '',
    cliente_tel: customer.phone || orderData.phone || '', cliente_pais: customer.country || orderData.country || '', cliente_ciudad: customer.city || orderData.city || '', cliente_direccion: customer.address || orderData.address || '',
    producto: items.map(i => `${i.name || i.nombre || i.producto || 'Producto nexo™'} x${i.quantity || i.cantidad || 1}`).join(' | '),
    producto_url: firstItem.url || firstItem.link || '', producto_nombre: firstItem.name || firstItem.nombre || firstItem.producto || 'Pedido nexo™', proveedor: firstItem.provider || firstItem.vendor || firstItem.proveedor || 'Marketplace externo',
    cantidad: items.reduce((n,i)=>n+Number(i.quantity || i.cantidad || 1),0) || 1, precio_usd: Number(orderData.total || 0), costo_producto_usd: Number(orderData.subtotal || 0), costo_envio_usd: Number(orderData.amazonShipping || 0),
    comision_nexo_usd: Number(orderData.commission || 0), impuesto_it_usd: Number(orderData.itf || 0), impuesto_iue_usd: Number(orderData.iue || 0), total_cliente_usd: Number(orderData.total || 0),
    moneda:'USD', metodo_pago: metodo, estado:'pendiente', estado_pago:'pendiente_confirmacion', estado_compra:'pendiente_agente_1', estado_envio:'pendiente', tracking:'',
    fecha_estimada_entrega: orderData.deliveryEstimate || '', prioridad_envio: orderData.deliveryLabel || orderData.shippingPriority || '',
    observaciones: `Cobro principal PayPal (${NEXO_PAYPAL_EMAIL}). El total cobrado incluye precio proveedor + comisión nexo™ sobre precio proveedor + costos externos aplicables. ${orderData.note || ''}`.trim()
  };
  return await client.from('pedidos').insert([row]).select().single();
};
window.nexoPrefillCheckoutFromSupabase = async function(){
  try{ const client=initNexoSupabase(); const email=(sessionStorage.getItem('clientEmail')||document.getElementById('email')?.value||'').trim(); if(!email)return; const {data,error}=await client.from('clientes').select('*').eq('email',email).maybeSingle(); if(error||!data)return; const set=(id,v)=>{const el=document.getElementById(id); if(el&&v!==undefined&&v!==null)el.value=v;}; const full=`${data.nombre||''} ${data.apellido||''}`.trim(); set('fullName',full); set('email',data.email||email); set('phoneCode',data.codigo_area||''); set('phoneNumber',data.telefono||''); set('region',data.region||''); set('city',data.ciudad||''); set('address',data.direccion||''); set('zipCode',data.codigo_postal||''); sessionStorage.setItem('nexoActiveClient', JSON.stringify({fullName:full,name:data.nombre||'',lastName:data.apellido||'',documentId:data.documento||'',email:data.email||email,country:data.pais||'',areaCode:data.codigo_area||'',phone:data.telefono||'',postalCode:data.codigo_postal||'',region:data.region||'',city:data.ciudad||'',address:data.direccion||''})); }catch(e){console.warn(e);}
};
window.addEventListener('DOMContentLoaded',()=>{try{initNexoSupabase();}catch(e){console.warn(e)} setTimeout(()=>window.nexoPrefillCheckoutFromSupabase?.(),400);});
