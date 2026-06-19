import { sb, hasServiceRole } from './_nexo-supabase.js';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}

function safe(s){ return encodeURIComponent(String(s || '')); }

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();

  try{
    if(req.method === 'GET'){
      const estado = req.query?.estado || 'activo';
      const path = `proveedores?select=*&estado=eq.${safe(estado)}&order=nombre.asc`;
      const rows = await sb(path, {headers:{Prefer:''}});
      return res.status(200).json({ok:true, service:'nexo-proveedores', serviceRole:hasServiceRole(), proveedores:rows || []});
    }

    if(req.method === 'POST'){
      const body = req.body || {};
      const item = {
        nombre: body.nombre,
        codigo: body.codigo,
        tipo: body.tipo || 'marketplace',
        marketplace: body.marketplace !== false,
        api_disponible: Boolean(body.api_disponible),
        api_url: body.api_url || '',
        api_key: body.api_key || '',
        api_secret: body.api_secret || '',
        sitio_web: body.sitio_web || '',
        pais: body.pais || '',
        moneda: body.moneda || 'USD',
        estado: body.estado || 'activo',
        observaciones: body.observaciones || '',
        fecha_actualizacion: new Date().toISOString()
      };
      if(!item.nombre || !item.codigo){
        return res.status(400).json({ok:false,error:'nombre y codigo son obligatorios'});
      }
      const rows = await sb('proveedores', {method:'POST', body:JSON.stringify([item])});
      return res.status(200).json({ok:true, proveedor:rows?.[0] || null});
    }

    return res.status(405).json({ok:false,error:'Método no permitido'});
  }catch(e){
    return res.status(e.statusCode || 500).json({ok:false,error:e.message || String(e), detail:e.detail || null});
  }
}
