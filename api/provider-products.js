// nexo™ – búsqueda multi-proveedor desde Supabase proveedor_productos
// Lee productos previamente sincronizados o cargados manualmente para Alibaba, Amazon, eBay, Mercado Libre, etc.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
function parseMoneyParam(v, mode='max'){
  const raw = String(v ?? '').trim();
  if(!raw) return 0;
  const nums = raw.match(/[0-9]+(?:\.[0-9]+)?/g);
  if(nums && nums.length){
    const arr = nums.map(Number).filter(Number.isFinite);
    if(!arr.length) return 0;
    return mode === 'min' ? Math.min(...arr) : Math.max(...arr);
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function providerLogo(name){
  const n=norm(name);
  if(n.includes('alibaba')) return '🇨🇳';
  if(n.includes('cj')) return '🇨🇳';
  if(n.includes('amazon')) return '🇺🇸';
  if(n.includes('ebay')) return '🌐';
  if(n.includes('mercado')) return '🌎';
  if(n.includes('walmart')) return '🇺🇸';
  if(n.includes('etsy')) return '🧵';
  if(n.includes('temu')) return '🛒';
  if(n.includes('aliexpress')) return '🇨🇳';
  return '🌐';
}
async function sb(path){
  if(!SUPABASE_URL || !SUPABASE_KEY) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json' }
  });
  const txt = await r.text();
  let data=[]; try{ data = txt ? JSON.parse(txt) : []; }catch{ data=[]; }
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return Array.isArray(data) ? data : [];
}
function normalizeRow(row, proveedores){
  const prov = proveedores.find(p => String(p.id) === String(row.proveedor_id)) || {};
  const provName = row.marketplace || prov.nombre || row.proveedor || 'Proveedor internacional';
  const price = Number(row.precio_original || row.precio || row.price || 0);
  return {
    id: `sup-${String(row.id || row.sku_original || Math.random()).replace(/[^a-zA-Z0-9_-]/g,'_')}`,
    proveedorProductoId: row.id,
    proveedor_id: row.proveedor_id,
    sku: row.sku_original || row.asin || '',
    asin: row.asin || '',
    name: row.nombre_original || row.nombre || 'Producto proveedor',
    title: row.nombre_original || row.nombre || 'Producto proveedor',
    price: Number((Number.isFinite(price)?price:0).toFixed(2)),
    category: row.categoria || row.subcategoria || 'General',
    provider: provName,
    proveedor: provName,
    providerLogo: providerLogo(provName),
    stock: row.stock ?? 'Verificar con proveedor',
    image: row.imagen_principal || (Array.isArray(row.imagenes) ? row.imagenes[0] : '') || '',
    sourceUrl: row.url_original || prov.sitio_web || '',
    url: row.url_original || prov.sitio_web || '',
    features: '',
    source: 'supabase-proveedor-productos',
    moneda: row.moneda || 'USD'
  };
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q = String(req.query.q || req.query.keyword || '').trim();
  const maxPrice = parseMoneyParam(req.query.maxPrice || req.query.max || 0, 'max');
  const size = Math.min(Math.max(Number(req.query.size || 20), 1), 100);
  const provider = norm(req.query.provider || '');
  try{
    const [rows, proveedores] = await Promise.all([
      sb('proveedor_productos?select=*&activo=eq.true&order=fecha_actualizacion.desc&limit=300'),
      sb('proveedores?select=*&order=nombre.asc&limit=100').catch(()=>[])
    ]);
    const qn = norm(q);
    let products = rows.map(r => normalizeRow(r, proveedores)).filter(p => p.price > 0);
    if(provider) products = products.filter(p => norm(p.provider).includes(provider));
    if(qn){
      const terms = qn.split(' ').filter(Boolean);
      products = products.filter(p => {
        const txt = norm([p.name,p.category,p.provider,p.sku,p.asin].join(' '));
        return terms.every(t => txt.includes(t)) || txt.includes(qn);
      });
    }
    if(maxPrice > 0) products = products.filter(p => p.price <= maxPrice);
    products = products.filter(p => /cj|alibaba|amazon/i.test(String(p.provider||p.proveedor||''))).sort((a,b)=>Number(a.price||0)-Number(b.price||0)).slice(0,size);
    return res.status(200).json({ok:true, source:'supabase-proveedor-productos', count:products.length, products});
  }catch(e){
    return res.status(500).json({ok:false, source:'supabase-proveedor-productos', error:e.message || String(e), products:[]});
  }
}
