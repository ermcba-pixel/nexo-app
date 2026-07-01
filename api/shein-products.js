// nexo™ – SHEIN Open Platform Product Search Bridge
// Prioridad: API oficial SHEIN -> cache Supabase -> respuesta clara sin simular producto real.
import { cors, money, clean, sheinPost, findFirstArray, normalizeSheinProduct, SHEIN_APP_ID, SHEIN_OPEN_KEY_ID, SHEIN_SECRET_KEY } from './shein-utils.js';

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
function normalize(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function first(...vals){ for(const v of vals){ if(v!==undefined && v!==null && String(v).trim()) return String(v).trim(); } return ''; }
function normalizeCacheProduct(row, idx){
  const raw=row.raw_data || row;
  const id=first(row.shein_product_id, raw.spuCode, raw.spu_code, raw.productId, raw.product_id, row.id, 'shein-'+idx);
  const sku=first(row.sku_code, raw.skuCode, raw.sku_code, raw.sku, id);
  const name=first(row.title, raw.title, raw.productName, raw.product_name, raw.goodsName, 'SHEIN product');
  const price=money(row.price ?? raw.price ?? raw.salePrice ?? raw.retailPrice ?? raw.suggestedRetailPrice ?? 0);
  const image=first(row.image_url, raw.imageUrl, raw.mainImage, raw.goodsImage, raw.pictureUrl, raw.imgUrl);
  const url=first(row.product_url, raw.productUrl, raw.url, raw.goodsUrl, 'https://www.shein.com');
  return {
    id:String(id).replace(/[^a-zA-Z0-9_-]/g,'_'), sheinProductId:id, sku,
    name, title:name, provider:'SHEIN', proveedor:'SHEIN', vendor:'SHEIN', providerLogo:'🛍️',
    price, cjProductCost:price, category:first(row.category, raw.categoryName, raw.category, 'SHEIN'),
    brand:first(row.brand, raw.brandName, raw.brand, 'SHEIN'), image, sourceUrl:url, url, originalProviderUrl:url,
    stock:first(row.stock_quantity, raw.stock, raw.inventory, 'Verificar stock SHEIN'),
    shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    source:'shein_open_platform_cache', features:'SHEIN Open Platform aprobado para nexo. Producto real desde cache/API.'
  };
}
async function searchCache(q, range, size){
  try{
    const { sb } = await import('./_nexo-supabase.js');
    const term=encodeURIComponent(`%${q}%`);
    const rows = await sb(`shein_products_cache?select=*&active=eq.true&or=(title.ilike.${term},category.ilike.${term},brand.ilike.${term},sku_code.ilike.${term})&limit=${Math.min(size,60)}`, {method:'GET'});
    return Array.isArray(rows) ? rows.map(normalizeCacheProduct).filter(p=>inRange(p, range)).sort((a,b)=>money(a.price)-money(b.price)) : [];
  }catch(e){ return []; }
}
async function logApi(endpoint, status, raw){
  try{
    const { sb } = await import('./_nexo-supabase.js');
    await sb('shein_api_logs', {method:'POST', body:JSON.stringify({endpoint,method:'POST',request_status:status?'ok':'error',response_code:String(raw?.status||''),response_message:raw?.data?.msg||raw?.data?.message||'',raw_response:raw?.data||raw||null})});
  }catch(e){}
}

async function searchOfficialApi(q, range, size, catSel){
  if(!SHEIN_OPEN_KEY_ID || !SHEIN_SECRET_KEY) return {ok:false, missingCredentials:true, products:[], message:'Faltan SHEIN_OPEN_KEY_ID y SHEIN_SECRET_KEY en Vercel.'};
  const bodies = [
    {keyword:q, pageNum:1, pageSize:size, language:'en'},
    {searchText:q, pageNum:1, pageSize:size, language:'en'},
    {productName:q, pageNum:1, pageSize:size, language:'en'},
    {query:q, page:1, pageSize:size, language:'en'}
  ];
  const paths = [
    '/open-api/goods/searchProduct',
    '/open-api/openapi-business-backend/product/query'
  ];
  let last=null;
  for(const path of paths){
    for(const payload of bodies){
      if(catSel) payload.category = catSel;
      const raw = await sheinPost(path, payload);
      last = {path, raw};
      await logApi(path, raw.ok, raw);
      const arr = findFirstArray(raw.data);
      const products = arr.map((r,i)=>normalizeSheinProduct(r,i)).filter(p=>inRange(p, range)).sort((a,b)=>money(a.price)-money(b.price));
      if(raw.ok && products.length) return {ok:true, source:'api', endpoint:path, products:products.slice(0,size), raw:raw.data};
    }
  }
  return {ok:false, products:[], message:last?.raw?.data?.msg || last?.raw?.data?.message || 'SHEIN API no devolvió productos para este término/rango.', last};
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=clean(req.query.q || req.query.search || '');
  const size=Math.min(Math.max(Number(req.query.size || 15),1),60);
  const range=parseRange(req);
  const catSel=clean(req.query.category || '');
  if(!q) return res.status(200).json({ok:true,provider:'SHEIN',products:[],message:'Ingrese un producto para buscar en SHEIN'});

  const official = await searchOfficialApi(q, range, size, catSel);
  if(official.ok){
    return res.status(200).json({ok:true,provider:'SHEIN',source:'shein_open_platform_api',products:official.products,count:official.products.length,appId:SHEIN_APP_ID,endpoint:official.endpoint,message:'Productos SHEIN obtenidos desde API oficial.'});
  }

  const cached=await searchCache(q, range, size);
  return res.status(200).json({
    ok:true,
    provider:'SHEIN',
    source: cached.length ? 'shein_open_platform_cache' : 'shein_open_platform_pending_credentials',
    products:cached.slice(0,size),
    count:cached.length,
    apiReady:Boolean(SHEIN_OPEN_KEY_ID && SHEIN_SECRET_KEY),
    appId:SHEIN_APP_ID,
    message: cached.length ? 'Productos SHEIN obtenidos desde cache/API.' : (official.message || 'SHEIN Open Platform aprobada; falta credencial openKey/secretKey o productos en cache.')
  });
}
