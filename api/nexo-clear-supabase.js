import { sb } from './_nexo-supabase.js';

const TABLES = [
  'logs_agente1',
  'tracking_envios',
  'facturas',
  'pagos',
  'pedidos',
  'productos',
  'tickets',
  'afiliados_amazon',
  'clientes'
];

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const body = req.body || {};
    if(body.confirm !== 'BORRAR TODO') return res.status(400).json({ok:false,error:'Confirmación inválida'});
    const results = [];
    for(const table of TABLES){
      try{
        await sb(`${table}?id=not.is.null`, { method:'DELETE', prefer:'return=minimal' });
        results.push({table, ok:true});
      }catch(e){
        results.push({table, ok:false, error:e.message || String(e)});
      }
    }
    return res.status(200).json({ok:true, results});
  }catch(e){
    return res.status(500).json({ok:false,error:e.message || String(e)});
  }
}
