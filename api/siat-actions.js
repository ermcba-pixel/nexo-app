const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path, opts={}){
  if(!SUPABASE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(opts.headers||{}) }
  });
  const txt = await r.text(); let data=null;
  try{ data=txt?JSON.parse(txt):[]; }catch{ data=txt; }
  if(!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data || [];
}
const num = v => Number(v || 0);
const first = (...xs) => xs.find(x => x !== undefined && x !== null && String(x).trim() !== '');
const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
function isPaid(o){ const s=String(first(o.estado_pago,o.estado,'')||'').toLowerCase(); return s.includes('pag') || s.includes('paid') || s.includes('aprob') || s.includes('complet') || s.includes('confirm'); }
function isBolivia(p){ const x=String(p||'').trim().toLowerCase(); return !x || ['bolivia','bo','bol','estado plurinacional de bolivia'].includes(x); }
function period(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function bsAmount(o){
  const bs = first(o.total_bs,o.monto_bs,o.total_bob,o.monto_bob);
  if(bs) return num(bs);
  const usd = num(first(o.total_cliente_usd,o.total_usd,o.precio_usd,o.total,o.monto,0));
  const tc = num(first(o.tipo_cambio,6.96));
  return Math.round(usd * tc * 100)/100;
}
function fiscalClient(order, clientes){
  const email = String(first(order.cliente_email, order.email, '')||'').toLowerCase();
  const c = clientes.find(x => String(x.email||'').toLowerCase() === email) || {};
  const pais = first(order.pais_facturacion, order.cliente_pais, order.pais, c.pais, 'Bolivia');
  const bol = isBolivia(pais);
  const nit = bol ? first(order.nit_ci_facturacion, order.nit_ci, order.documento, order.cliente_documento, c.nit_ci, c.documento, 'PENDIENTE') : '99001';
  const razon = first(order.razon_social_facturacion, order.razon_social, order.cliente_razon_social, c.razon_social, `${first(order.cliente_nombre,c.nombre,'')} ${first(order.cliente_apellido,c.apellido,'')}`.trim(), order.cliente_nombre, c.nombre, 'SIN NOMBRE');
  return {cliente_id:isUuid(c.id)?c.id:(isUuid(order.cliente_id)?order.cliente_id:null), pais, es_bolivia:bol, numero_documento:String(nit), razon_social:String(razon), email:first(email,c.email,order.cliente_email,'')||'', telefono:first(c.telefono,order.cliente_telefono,'')||'', direccion:first(c.direccion,order.direccion,'')||'', validado_siat:false, observaciones: bol && String(nit)==='PENDIENTE' ? 'Cliente Bolivia sin NIT/CI: revisar antes de enviar a SIAT.' : 'Prevalidación automática nexo.'};
}
async function audit(accion, registro_id, despues, req){
  try{ await sb('siat_auditoria_fiscal', {method:'POST', body:JSON.stringify([{tabla:'siat_facturas', registro_id, accion, despues, usuario:req.headers['x-nexo-user']||'superadministrador', ip:req.headers['x-forwarded-for']||req.socket?.remoteAddress||'', user_agent:req.headers['user-agent']||''}])}); }catch(e){}
}
async function crearPrefacturas(req){
  const [pedidos, clientes, existentes] = await Promise.all([
    sb('pedidos?select=*&limit=500'),
    sb('clientes?select=*&limit=500').catch(()=>[]),
    sb('siat_facturas?select=pedido_id&limit=1000').catch(()=>[])
  ]);
  const used = new Set((existentes||[]).map(x=>String(x.pedido_id)).filter(Boolean));
  const candidates = (pedidos||[]).filter(o => o.id && !used.has(String(o.id)) && isPaid(o)).slice(0,50);
  let created=0, skipped=0, errors=[];
  for(const o of candidates){
    try{
      const fc = fiscalClient(o, clientes||[]);
      const cliRows = await sb('siat_clientes_fiscales', {method:'POST', body:JSON.stringify([fc])});
      const cli = cliRows[0] || {};
      const totalBs = bsAmount(o);
      const obs = fc.observaciones;
      const factRows = await sb('siat_facturas', {method:'POST', body:JSON.stringify([{
        pedido_id:o.id, cliente_fiscal_id:cli.id, estado:'BORRADOR', ambiente:'PILOTO', nit_ci_cliente: fc.es_bolivia ? fc.numero_documento : '99001', razon_social_cliente: fc.razon_social, codigo_cliente: fc.es_bolivia ? fc.numero_documento : '99001', pais_cliente: fc.pais, email_cliente: fc.email, moneda:'BOB', tipo_cambio:num(first(o.tipo_cambio,6.96)), subtotal_bs:totalBs, total_bs:totalBs, monto_pagar_bs:totalBs, importe_base_credito_fiscal_bs:totalBs, forma_pago:first(o.metodo_pago,o.metodo,'POR_REVISAR'), canal_pago:first(o.canal_pago,o.metodo_pago,''), transaccion_pago:first(o.paypal_order_id,o.referencia,o.id,''), observaciones:obs
      }])});
      const f = factRows[0];
      await sb('siat_factura_items', {method:'POST', body:JSON.stringify([{siat_factura_id:f.id, descripcion:first(o.descripcion,o.producto_nombre,o.nombre_producto,'Servicio de Intermediación Comercial Internacional nexo'), precio_unitario_bs:totalBs, subtotal_bs:totalBs}])});
      await audit('CREAR_BORRADOR_FISCAL', f.id, f, req);
      created++;
    }catch(e){ errors.push({pedido_id:o.id,error:e.message}); skipped++; }
  }
  return {created, skipped, errors, candidates:candidates.length};
}
async function marcarPendiente(req, body){
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if(!ids.length) throw new Error('No seleccionaste facturas.');
  const rows = await sb(`siat_facturas?id=in.(${ids.join(',')})`, {method:'PATCH', body:JSON.stringify({estado:'PENDIENTE_ENVIO', observaciones:'Aprobada internamente para envío SIAT. Pendiente conexión real CUIS/CUFD/XML/firma.'})});
  for(const r of rows) await audit('APROBAR_PARA_ENVIO_SIAT', r.id, r, req);
  return {updated:rows.length, rows};
}
async function crearEvento(req, body){
  const row = {codigo_evento: body.codigo_evento || '1', descripcion: body.descripcion || 'Corte del servicio de Internet', fecha_inicio: body.fecha_inicio || new Date().toISOString(), estado:'ABIERTO'};
  const rows = await sb('siat_eventos_significativos', {method:'POST', body:JSON.stringify([row])});
  try{ await sb('siat_auditoria_fiscal', {method:'POST', body:JSON.stringify([{tabla:'siat_eventos_significativos', registro_id:rows[0].id, accion:'CREAR_EVENTO_SIGNIFICATIVO', despues:rows[0], usuario:'superadministrador'}])}); }catch(e){}
  return {created:1, row:rows[0]};
}
export default async function handler(req,res){
  try{
    if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Método no permitido'});
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body||'{}');
    let data;
    if(body.action === 'crear_prefacturas') data = await crearPrefacturas(req);
    else if(body.action === 'aprobar_envio') data = await marcarPendiente(req, body);
    else if(body.action === 'crear_evento') data = await crearEvento(req, body);
    else throw new Error('Acción SIAT no reconocida');
    res.status(200).json({ok:true, ...data});
  }catch(e){ res.status(500).json({ok:false,error:e.message||String(e)}); }
}
