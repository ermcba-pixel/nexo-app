// nexo – Multi-provider Product Search API
// Combina CJ real + Alibaba preparado + Amazon respaldo para que la tienda no dependa de un solo proveedor.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}
function clean(s){ return String(s||'').trim(); }
function money(n){ const x=Number(n||0); return Number.isFinite(x) ? Number(x.toFixed(2)) : 0; }
function parseRange(req){
  const nums = String(req.query.priceRange || req.query.rango || req.query.maxPrice || req.query.max || '').match(/[0-9]+(?:\.[0-9]+)?/g) || [];
  const arr = nums.map(Number).filter(Number.isFinite).filter(n=>n>=0);
  if(arr.length === 0) return {min:0,max:0};
  if(arr.length === 1) return {min:Number(req.query.minPrice || req.query.min || 0) || 0, max:arr[0]};
  return {min:Math.min(...arr), max:Math.max(...arr)};
}
function inRange(p, range){
  const price = money(p?.price || p?.cjProductCost || 0);
  if(price <= 0) return false;
  if(range.min > 0 && price < range.min) return false;
  if(range.max > 0 && price > range.max) return false;
  return true;
}
function sortProducts(products){
  return products
    .filter(p=>p && money(p.price)>0)
    .sort((a,b)=>money(a.price)-money(b.price));
}
async function callLocal(req, path){
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const url = `${proto}://${host}${path}`;
  const r = await fetch(url, {cache:'no-store'});
  const data = await r.json().catch(()=>({ok:false,error:'invalid_json'}));
  return {status:r.status, data};
}
function normalizeFromTable(row){
  return {
    id:`supabase-${row.id}`,
    sku: row.sku_original || row.sku || '',
    name: row.nombre_original || row.nombre || 'Producto proveedor',
    title: row.nombre_original || row.nombre || 'Producto proveedor',
    provider: row.marketplace || row.proveedor_nombre || row.proveedor || 'Proveedor',
    proveedor: row.marketplace || row.proveedor_nombre || row.proveedor || 'Proveedor',
    vendor: row.marketplace || row.proveedor_nombre || row.proveedor || 'Proveedor',
    providerLogo: row.marketplace === 'Alibaba' ? '🟧' : '🌐',
    price: money(row.precio_original || row.precio || 0),
    category: row.categoria || 'general',
    image: row.imagen_principal || '',
    sourceUrl: row.url_original || '',
    url: row.url_original || '',
    stock: row.stock || 'Verificar stock',
    source:'supabase-proveedor_productos',
    features:'Producto registrado en proveedor_productos de Supabase.'
  };
}
async function searchSupabaseProductos(q, priceRange){
  try{
    const { sb } = await import('./_nexo-supabase.js');
    const term = encodeURIComponent(`%${q}%`);
    let path = `proveedor_productos?select=*&or=(nombre_original.ilike.${term},descripcion_original.ilike.${term},sku_original.ilike.${term})&limit=20`;
    const rows = await sb(path, {method:'GET', prefer:'return=representation'});
    let products = Array.isArray(rows) ? rows.map(normalizeFromTable) : [];
    products = products.filter(p=>inRange(p, priceRange));
    return products;
  }catch(e){ return []; }
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = clean(req.query.q || req.query.search || '');
  const priceRange = parseRange(req);
  const maxPrice = priceRange.max;
  const category = clean(req.query.category || '');
  const size = Math.min(Math.max(Number(req.query.size || 20),1),60);
  if(!q) return res.status(200).json({ok:true, products:[], providers:[], message:'Ingrese un producto para buscar'});

  const qs = new URLSearchParams({q, size:String(size), lang:clean(req.query.lang||'es')});
  if(Number(priceRange.min)>0) qs.set('minPrice', String(priceRange.min));
  if(Number(priceRange.max)>0) qs.set('maxPrice', String(priceRange.max));
  if(category) qs.set('category', category);

  const results = await Promise.allSettled([
    searchSupabaseProductos(q,priceRange),
    callLocal(req, `/api/cj-products?${qs.toString()}`),
    callLocal(req, `/api/alibaba-products?${qs.toString()}&size=15`),
    callLocal(req, `/api/amazon-products?${qs.toString()}`)
  ]);

  const products=[];
  const providers=[];
  const notices=[];

  const supa = results[0];
  if(supa.status==='fulfilled' && Array.isArray(supa.value) && supa.value.length){ products.push(...supa.value); providers.push('Supabase'); }

  for(const r of results.slice(1)){
    if(r.status !== 'fulfilled') continue;
    const data = r.value?.data || {};
    if(data.provider) providers.push(data.provider);
    if(data.notice) notices.push(data.notice);
    if(data.ok !== false && Array.isArray(data.products)) products.push(...data.products);
  }

  const amazon = products.filter(p=>String(p.provider||p.proveedor||'').toLowerCase().includes('amazon')).slice(0,1);
  const cj = sortProducts(products.filter(p=>String(p.provider||p.proveedor||'').toLowerCase().includes('cj'))).slice(0,15);
  const alibaba = sortProducts(products.filter(p=>String(p.provider||p.proveedor||'').toLowerCase().includes('alibaba'))).slice(0,15);
  const out = [...amazon, ...sortProducts([...cj, ...alibaba])].filter(p=>inRange(p, priceRange)).slice(0,size);
  return res.status(200).json({
    ok:true,
    provider:'Multi-proveedor',
    providers:[...new Set(providers)],
    count:out.length,
    mode:'cj_alibaba_amazon_supabase',
    notices,
    products:out
  });
}
