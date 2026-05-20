const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv';

async function sb(path, options={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers:{
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type':'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers||{})
    }
  });
  const text = await r.text();
  let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}

async function findClientId(email){
  if(!email) return null;
  try{
    const rows = await sb(`clientes?select=id,email&email=eq.${encodeURIComponent(email)}&limit=1`, {headers:{Prefer:''}, prefer:''});
    return rows?.[0]?.id || null;
  }catch(e){ return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error: 'Método no permitido' });

  try {
    const p = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ticket = p.ticket || ('NEXO-R-' + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + Math.floor(100000+Math.random()*900000));
    const nombre = p.nombre || p.nombre_cliente || '';
    const email = p.email || p.correo || '';
    const descripcion = p.descripcion || p.mensaje || '';
    if(!nombre || !email || !descripcion){
      return res.status(400).json({ok:false,error:'Faltan nombre, correo o descripción'});
    }
    const cliente_id = p.cliente_id || await findClientId(email);
    const asunto = p.asunto || `${ticket} - ${p.tipo || p.tipo_reclamo || 'Reclamo'}`;
    const mensaje = p.mensaje || [
      'Ticket: '+ticket,
      'Nombre: '+nombre,
      'Correo: '+email,
      'Teléfono / WhatsApp: '+(p.telefono||''),
      'País: '+(p.pais||''),
      'Pedido: '+(p.pedido||'No informado'),
      'Producto: '+(p.producto||'No informado'),
      'Canal preferido: '+(p.canal||''),
      '',
      'Descripción:',
      descripcion
    ].join('\n');

    const row = {
      cliente_id: cliente_id || null,
      nombre_cliente: nombre,
      email,
      asunto,
      tipo_reclamo: p.tipo || p.tipo_reclamo || 'Soporte',
      mensaje,
      estado: 'Nuevo',
      prioridad: p.prioridad || 'Media',
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };
    const data = await sb('tickets', {method:'POST', body:JSON.stringify(row)});
    return res.status(200).json({ok:true, success:true, ticketId:ticket, cliente_id:row.cliente_id, data});
  } catch (error) {
    return res.status(500).json({ok:false,error:error.message||String(error)});
  }
}
