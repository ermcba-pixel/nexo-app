// nexo™ – SHEIN Open Platform Product Search Bridge
// Integración limpia: no simula productos. Devuelve productos reales desde cache Supabase
// y queda preparado para activar llamadas API oficiales cuando existan openKeyId/secretKey.
// Requiere para producción real: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}
function money(v){ const n=Number(v||0); return Number.isFinite(n) ? Number(n.toFixed(2)) : 0; }
function clean(v){ return String(v||'').trim(); }
function normalize(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function parseRange(req){
  const min=Number(req.query.minPrice || req.query.min || 0);
  const max=Number(req.query.maxPrice || req.query.max || 0);
  return {min:Number.isFinite(min)&&min>0?min:0, max:Number.isFinite(max)&&max>0?max:0};
}
function inRange(p, range){
  const price=money(p.price || p.cjProductCost || 0);
  if(price<=0) return false;
  if(range.min && price<range.min) return false;
  if(range.max && price>range.max) return false;
  return true;
}
function first(...vals){ for(const v of vals){ if(v!==undefined && v!==null && String(v).trim()) return String(v).trim(); } return ''; }
function normalizeProduct(row, idx){
  const raw=row.raw_data || row;
  const id=first(row.shein_product_id, raw.spuCode, raw.spu_code, raw.productId, raw.product_id, row.id, 'shein-'+idx);
  const sku=first(row.sku_code, raw.skuCode, raw.sku_code, raw.sku, id);
  const name=first(row.title, raw.title, raw.productName, raw.product_name, raw.goodsName, 'SHEIN product');
  const price=money(row.price ?? raw.price ?? raw.salePrice ?? raw.retailPrice ?? raw.suggestedRetailPrice ?? 0);
  const image=first(row.image_url, raw.imageUrl, raw.mainImage, raw.goodsImage, raw.pictureUrl, raw.imgUrl);
  const url=first(row.product_url, raw.productUrl, raw.url, raw.goodsUrl, 'https://www.shein.com');
  return {
    id:String(id).replace(/[^a-zA-Z0-9_-]/g,'_'),
    sheinProductId:id,
    sku,
    name,
    title:name,
    provider:'SHEIN', proveedor:'SHEIN', vendor:'SHEIN', providerLogo:'🛍️',
    price, cjProductCost:price,
    category:first(row.category, raw.categoryName, raw.category, 'SHEIN'),
    brand:first(row.brand, raw.brandName, raw.brand, 'SHEIN'),
    image,
    sourceUrl:url,
    url,
    originalProviderUrl:url,
    stock:first(row.stock_quantity, raw.stock, raw.inventory, 'Verificar stock SHEIN'),
    shippingAmazon:0,
    cjShippingCost:0,
    vendorFee:0,
    cjHandlingFee:0,
    source:'shein_open_platform_cache',
    features:'SHEIN Open Platform aprobado para nexo. Producto real desde cache/API.'
  };
}
async function searchCache(q, range, size){
  try{
    const { sb } = await import('./_nexo-supabase.js');
    const term=encodeURIComponent(`%${q}%`);
    const rows = await sb(`shein_products_cache?select=*&active=eq.true&or=(title.ilike.${term},category.ilike.${term},brand.ilike.${term},sku_code.ilike.${term})&limit=${Math.min(size,60)}`, {method:'GET'});
    return Array.isArray(rows) ? rows.map(normalizeProduct).filter(p=>inRange(p, range)).sort((a,b)=>money(a.price)-money(b.price)) : [];
  }catch(e){ return []; }
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=clean(req.query.q || req.query.search || '');
  const size=Math.min(Math.max(Number(req.query.size || 15),1),60);
  const range=parseRange(req);
  if(!q) return res.status(200).json({ok:true,provider:'SHEIN',products:[],message:'Ingrese un producto para buscar en SHEIN'});

  const cached=await searchCache(q, range, size);
  return res.status(200).json({
    ok:true,
    provider:'SHEIN',
    source:'shein_open_platform',
    products:cached.slice(0,size),
    count:cached.length,
    apiReady:Boolean(process.env.SHEIN_OPEN_KEY_ID && process.env.SHEIN_SECRET_KEY),
    appId:process.env.SHEIN_APP_ID || '15C6DD3A848008B5F87E4C28F4E23',
    message: cached.length ? 'Productos SHEIN obtenidos desde cache/API.' : 'SHEIN Open Platform está aprobada. Falta obtener openKey/secretKey o sincronizar productos en shein_products_cache.'
  });
}
