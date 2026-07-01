// nexo™ – Alibaba Product Search API REAL ONLY
// Corrección ACJALB: usa gateway oficial Alibaba Open Platform REST.
// No usa Taobao router. No genera productos, precios ni fotos de prueba.

import crypto from 'crypto';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}

function norm(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
}

function parseRange(minRaw, maxRaw){
  const all = `${minRaw ?? ''} ${maxRaw ?? ''}`.match(/[0-9]+(?:\.[0-9]+)?/g) || [];
  const nums = all.map(Number).filter(Number.isFinite);
  if(!nums.length) return {min:0,max:0};
  return nums.length > 1 ? {min:Math.min(...nums), max:Math.max(...nums)} : {min:0, max:nums[0]};
}

function translate(q){
  const key=norm(q);
  const map={
    calcetin:'socks',calcetines:'socks',medias:'socks',media:'socks',
    zapato:'shoes',zapatos:'shoes',zapatillas:'sneakers',tenis:'sneakers',
    cordon:'shoelaces',cordones:'shoelaces',camisa:'shirts',camisas:'shirts',
    polera:'t shirts',poleras:'t shirts',blusa:'blouse',blusas:'blouses',
    pantalon:'pants',pantalones:'pants',mochila:'backpack',mochilas:'backpack',
    celular:'phone',telefono:'phone',reloj:'watch',relojes:'watch',
    audifonos:'earbuds',auriculares:'earbuds',laptop:'laptop'
  };
  return map[key] || q || 'product';
}

function appKey(){return process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY || process.env.ALIBABA_CLIENT_ID || process.env.ALIBABA_APP_ID || '';}
function appSecret(){return process.env.ALIBABA_APP_SECRET || process.env.ALIBABA_APPSECRET || process.env.ALIBABA_CLIENT_SECRET || process.env.ALIBABA_SECRET_KEY || '';}
function token(){return process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN || process.env.ALIBABA_SESSION || process.env.ALIBABA_SESSION_KEY || '';}
function restBase(){return (process.env.ALIBABA_REST_BASE || 'https://openapi-api.alibaba.com/rest').replace(/\/$/,'');}

function signSha256(params, secret){
  const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && k !== 'sign').sort();
  const base = keys.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

async function fetchJson(url, opts={}){
  const r = await fetch(url, {...opts, cache:'no-store'});
  const text = await r.text();
  let data = null;
  try{ data = JSON.parse(text); }catch(e){}
  return {ok:r.ok, status:r.status, text, data};
}

function numberFrom(v){
  if(v === null || v === undefined || v === '') return 0;
  if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const nums = String(v).replace(/,/g,'').match(/[0-9]+(?:\.[0-9]+)?/g);
  if(!nums) return 0;
  const arr = nums.map(Number).filter(n => Number.isFinite(n) && n > 0);
  return arr.length ? Math.min(...arr) : 0;
}

function pickImage(p){
  const candidates=[
    p?.main_image?.images?.[0], p?.mainImage?.images?.[0], p?.main_image?.url, p?.mainImage?.url,
    p?.image, p?.image_url, p?.imageUrl, p?.picture_url, p?.pictureUrl, p?.pic_url, p?.picUrl,
    p?.thumbnail, p?.thumb_url, p?.thumbnail_url, p?.poster,
    Array.isArray(p?.images)?p.images[0]:null,
    Array.isArray(p?.product_images)?p.product_images[0]:null,
    Array.isArray(p?.productImages)?p.productImages[0]:null
  ];
  const v=candidates.find(Boolean);
  if(typeof v === 'object') return String(v.url || v.imageUrl || v.image_url || v.picUrl || v.pic_url || '').trim();
  let out = String(v || '').trim();
  if(out.startsWith('//')) out = 'https:' + out;
  if(out.startsWith('http://')) out = 'https://' + out.slice(7);
  return out;
}

function pickPrice(p){
  const scalar=[p?.price,p?.min_price,p?.minPrice,p?.fob_price,p?.fobPrice,p?.reference_price,p?.referencePrice,p?.promotion_price,p?.promotionPrice,p?.priceInfo?.price,p?.price_info?.price,p?.wholesale_trade?.price,p?.wholesaleTrade?.price];
  const nested=[p?.price_range,p?.priceRange,p?.price_ranges,p?.priceRanges,p?.wholesale_trade?.price_ranges,p?.wholesaleTrade?.priceRanges,p?.sku_infos,p?.skuInfos,p?.product_sku_infos,p?.productSkuInfos];
  const vals=[];
  for(const v of scalar){const n=numberFrom(v); if(n>0) vals.push(n);}
  for(const obj of nested){
    const arr = Array.isArray(obj) ? obj : [obj];
    for(const x of arr){
      const n=numberFrom(x?.price ?? x?.min_price ?? x?.minPrice ?? x?.sale_price ?? x?.salePrice ?? x?.fob_price ?? x?.fobPrice ?? x);
      if(n>0) vals.push(n);
    }
  }
  return vals.length ? Math.min(...vals) : 0;
}

function pid(p){return p?.id || p?.product_id || p?.productId || p?.offer_id || p?.offerId || p?.offerIdStr || p?.product_id_str || p?.encrypted_id || p?.encryptedId || '';}

function productArray(data){
  const keys=['products','product','product_list','productList','items','item_list','data','list','result_list','productInfos','product_infos','offerList','offer_list'];
  const seen=new Set();
  function score(x){
    if(!x || typeof x !== 'object') return 0;
    let s=0;
    if(pid(x)) s+=3;
    if(pickImage(x)) s+=2;
    if(pickPrice(x)>0) s+=2;
    if(x.subject || x.name || x.title || x.product_name || x.productName) s+=2;
    return s;
  }
  function walk(node, depth=0){
    if(!node || depth>8) return [];
    if(Array.isArray(node)){
      const objs=node.filter(x=>x && typeof x === 'object');
      if(objs.length && objs.some(x=>score(x)>=3)) return objs;
      for(const x of objs){ const r=walk(x, depth+1); if(r.length) return r; }
      return [];
    }
    if(typeof node === 'object'){
      if(seen.has(node)) return [];
      seen.add(node);
      for(const k of keys){ if(Array.isArray(node[k])){ const r=walk(node[k], depth+1); if(r.length) return r; } }
      for(const v of Object.values(node)){ const r=walk(v, depth+1); if(r.length) return r; }
    }
    return [];
  }
  return walk(data);
}

function productObject(data){
  return data?.result?.product || data?.product || data?.data?.product || data?.alibaba_icbu_product_get_response?.result?.product || data?.alibaba_icbu_product_get_response?.product || null;
}

function normalizeProduct(p,idx,q){
  const id = pid(p) || `ali-${idx}`;
  const name = p?.subject || p?.name || p?.title || p?.product_name || p?.productName || `Alibaba ${translate(q)}`;
  const price = pickPrice(p);
  const image = pickImage(p);
  const url = p?.pc_detail_url || p?.pcDetailUrl || p?.detail_url || p?.detailUrl || p?.url || ('https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)));
  const moq = p?.min_order_quantity || p?.minOrderQuantity || p?.moq || p?.min_order || p?.minOrder || '';
  return {
    id:`alibaba-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,
    alibabaProductId:String(id), sku:`ALI-${String(id).slice(0,24)}`,
    name, title:name, price:Number(price.toFixed(2)), cjProductCost:Number(price.toFixed(2)),
    provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳',
    category:p?.category_id || p?.categoryId || 'Alibaba',
    stock: moq ? `MOQ: ${moq}` : 'Verificar MOQ, stock y envío con Alibaba',
    moq, shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    sourceUrl:url, url, originalProviderUrl:url, image,
    source:'alibaba-open-platform-rest-real',
    owner:p?.owner_member_display_name || p?.ownerMemberDisplayName || '',
    features:'Producto real de Alibaba Open Platform. Confirmar MOQ, precio final, stock y envío antes de comprar.'
  };
}

async function callAlibabaRest(path, paramsExtra={}, httpMethod='POST'){
  const base = restBase();
  const pathClean = String(path || '').replace(/^\/+/, '');
  const params = {
    app_key: appKey(),
    sign_method: 'sha256',
    access_token: token(),
    timestamp: String(Date.now()),
    ...paramsExtra
  };
  params.sign = signSha256(params, appSecret());
  const qs = new URLSearchParams(params).toString();
  const url = `${base}/${pathClean}`;
  if(httpMethod === 'GET'){
    const out = await fetchJson(`${url}?${qs}`);
    return { ...out, requestUrl: `${url}?${qs.replace(params.access_token, '[TOKEN]')}` };
  }
  const out = await fetchJson(url, {method:'POST', headers:{'content-type':'application/x-www-form-urlencoded;charset=utf-8'}, body:qs});
  return { ...out, requestUrl: `${url}?${qs.replace(params.access_token, '[TOKEN]')}` };
}

function permissionMessage(data, text){
  const raw = JSON.stringify(data || {}) + ' ' + String(text || '');
  if(/InsufficientPermission|does not have permission|permission/i.test(raw)){
    return 'Alibaba respondió InsufficientPermission: la aplicación todavía no tiene permiso para consultar la API de productos /alibaba/icbu/product/list. La conexión NEXO-Vercel-Alibaba está correcta; falta habilitar ese permiso/API en Alibaba Open Platform.';
  }
  if(/Invalid app Key|appkey-not-exists/i.test(raw)){
    return 'Alibaba respondió Invalid app Key: revise que ALIBABA_APP_KEY corresponda exactamente a la App activa en Alibaba Open Platform.';
  }
  if(/access_token|session|expired|invalid token/i.test(raw)){
    return 'Alibaba respondió error de token: renueve ALIBABA_ACCESS_TOKEN en Alibaba Open Platform y actualícelo en Vercel.';
  }
  return 'Alibaba no devolvió productos reales con precio. No se muestran productos ni fotos de prueba.';
}

async function listProducts(q,size){
  const subject = translate(q);
  const pageSize = String(Math.min(Math.max(Number(size||15),1),15));
  const variants = [
    {current_page:'1', page_size:pageSize, subject, language:'ENGLISH'},
    {currentPage:'1', pageSize:pageSize, subject, language:'ENGLISH'},
    {product_list_request:JSON.stringify({currentPage:1,pageSize:Number(pageSize),subject,keywords:subject,language:'ENGLISH'})}
  ];
  const attempts=[];
  for(const extra of variants){
    const out = await callAlibabaRest('/alibaba/icbu/product/list', extra, 'POST');
    attempts.push({gateway:restBase(), path:'/alibaba/icbu/product/list', method:'POST', status:out.status, body:String(out.text||'').slice(0,420)});
    const arr = productArray(out.data);
    if(out.ok && arr.length) return {ok:true, products:arr, raw:out.data, attempts};
    if(/InsufficientPermission|does not have permission/i.test(String(out.text||''))) return {ok:false, products:[], raw:out.data, attempts, permission:true, message:permissionMessage(out.data,out.text)};
  }
  return {ok:false, products:[], attempts, message:permissionMessage(null, attempts.map(a=>a.body).join(' '))};
}

async function getProductDetail(id){
  if(!id) return null;
  const variants = [
    {product_id:String(id), productId:String(id), language:'ENGLISH'},
    {product_get_request:JSON.stringify({product_id:String(id),productId:String(id),language:'ENGLISH'})}
  ];
  for(const extra of variants){
    const out = await callAlibabaRest('/icbu/product/get', extra, 'POST');
    if(out.ok){ const obj = productObject(out.data); if(obj) return obj; }
  }
  return null;
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = String(req.query.q || req.query.keyword || '').trim();
  const range = parseRange(req.query.minPrice || req.query.min, req.query.maxPrice || req.query.max || req.query.price || 0);
  const size = Math.min(Math.max(Number(req.query.size || 15),1),30);
  const debug = String(req.query.debug || '') === '1';

  const ak=appKey(), secret=appSecret(), tk=token();
  if(!ak || !secret || !tk){
    return res.status(200).json({
      ok:false, provider:'Alibaba', products:[],
      message:'Faltan variables Alibaba en Vercel.',
      seen:{ALIBABA_APP_KEY:Boolean(ak),ALIBABA_APP_SECRET:Boolean(secret),ALIBABA_ACCESS_TOKEN:Boolean(tk)}
    });
  }

  try{
    const listed = await listProducts(q,size);
    const enriched=[];
    for(const item of (listed.products || []).slice(0,15)){
      let merged=item;
      const n0=normalizeProduct(item,enriched.length,q);
      if((!n0.price || !n0.image) && pid(item) && enriched.length < 5){
        const detail = await getProductDetail(pid(item));
        if(detail) merged = {...item, ...detail};
      }
      const n=normalizeProduct(merged,enriched.length,q);
      if(n.price > 0 && n.image) enriched.push(n);
    }

    let products = enriched;
    if(range.min > 0) products = products.filter(p => p.price >= range.min);
    if(range.max > 0) products = products.filter(p => p.price <= range.max);
    products = products.sort((a,b)=>a.price-b.price).slice(0,15);

    return res.status(200).json({
      ok:products.length>0,
      provider:'Alibaba',
      mode:'alibaba_open_platform_rest_real',
      gateway:restBase(),
      endpoint:'/alibaba/icbu/product/list + /icbu/product/get',
      query:q,
      translated:translate(q),
      range,
      count:products.length,
      products,
      message:products.length ? 'Productos reales Alibaba devueltos.' : (listed.message || 'Alibaba no devolvió productos reales con precio. No se muestran productos ni fotos de prueba.'),
      diagnostic:(debug || !products.length) ? {reason: listed.permission ? 'insufficient_permission' : (listed.ok ? 'list_without_price_or_image' : 'list_empty_or_unreachable'), attempts:(listed.attempts||[]).slice(-10), env:{app_key:Boolean(ak),app_secret:Boolean(secret),access_token:Boolean(tk)}} : undefined
    });
  }catch(e){
    return res.status(200).json({ok:false,provider:'Alibaba',products:[],message:'Error consultando Alibaba Open Platform: '+String(e.message||e),diagnostic:debug?{stack:String(e.stack||'')}:undefined});
  }
}
