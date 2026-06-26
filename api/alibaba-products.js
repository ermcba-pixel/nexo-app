// nexo™ – Alibaba Product Search API REAL ONLY
// No genera productos, precios ni fotos de prueba.
// Busca con /alibaba/icbu/product/list y, cuando hay ID, completa detalles con /icbu/product/get.

import crypto from 'crypto';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
function parseMax(v){const raw=String(v??'').trim(); if(!raw) return 0; const nums=raw.match(/[0-9]+(?:\.[0-9]+)?/g)||[]; const arr=nums.map(Number).filter(Number.isFinite); return arr.length?Math.max(...arr):0;}
function translate(q){
  const key=norm(q);
  const map={calcetin:'socks',calcetines:'socks',medias:'socks',media:'socks',zapato:'shoes',zapatos:'shoes',zapatillas:'sneakers',tenis:'sneakers',cordon:'shoelaces',cordones:'shoelaces',camisa:'shirts',camisas:'shirts',polera:'t shirts',poleras:'t shirts',blusa:'blouse',blusas:'blouses',pantalon:'pants',pantalones:'pants',mochila:'backpack',mochilas:'backpack',celular:'phone',telefono:'phone',reloj:'watch',relojes:'watch',audifonos:'earbuds',auriculares:'earbuds',laptop:'laptop'};
  return map[key] || q || 'product';
}
function appKey(){return process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY || process.env.ALIBABA_CLIENT_ID || process.env.ALIBABA_APP_ID || '';} 
function appSecret(){return process.env.ALIBABA_APP_SECRET || process.env.ALIBABA_APPSECRET || process.env.ALIBABA_CLIENT_SECRET || process.env.ALIBABA_SECRET_KEY || '';} 
function token(){return process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN || process.env.ALIBABA_SESSION || process.env.ALIBABA_SESSION_KEY || '';} 
function signTop(params, secret, method='hmac'){
  const keys=Object.keys(params).filter(k=>params[k]!==undefined && params[k]!==null && k!=='sign').sort();
  const base=keys.map(k=>`${k}${params[k]}`).join('');
  if(method === 'md5') return crypto.createHash('md5').update(secret + base + secret, 'utf8').digest('hex').toUpperCase();
  if(method === 'sha256') return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
  return crypto.createHmac('md5', secret).update(base, 'utf8').digest('hex').toUpperCase();
}
function baseParams(apiName, extra, apiField='method', signMethod='hmac', includeAccessToken=false){
  const params={
    app_key:appKey(), session:token(),
    timestamp:new Date(Date.now()+8*60*60*1000).toISOString().slice(0,19).replace('T',' '),
    format:'json', v:'2.0', sign_method:signMethod,
    partner_id:'nexo', simplify:'true',
    ...extra
  };
  if(includeAccessToken) params.access_token = token();
  params[apiField]=apiName;
  params.sign=signTop(params, appSecret(), signMethod);
  return params;
}
async function fetchText(url, opts={}){
  const r=await fetch(url,{...opts,cache:'no-store'});
  const text=await r.text();
  let data=null; try{data=JSON.parse(text);}catch(e){}
  return {ok:r.ok,status:r.status,text,data};
}
function pickImage(p){
  const candidates=[
    p?.main_image?.images?.[0], p?.mainImage?.images?.[0], p?.main_image?.url, p?.mainImage?.url,
    p?.image, p?.image_url, p?.imageUrl, p?.picture_url, p?.pictureUrl, p?.pic_url, p?.picUrl,
    p?.thumbnail, p?.thumb_url, p?.thumbnail_url, p?.poster,
    Array.isArray(p?.images)?p.images[0]:null, Array.isArray(p?.product_images)?p.product_images[0]:null,
    Array.isArray(p?.productImages)?p.productImages[0]:null, Array.isArray(p?.productImage)?p.productImage[0]:null,
    p?.product?.main_image?.images?.[0], p?.result?.product?.main_image?.images?.[0]
  ];
  const v=candidates.find(Boolean);
  if(typeof v==='object') return String(v.url || v.imageUrl || v.image_url || v.picUrl || v.pic_url || '').trim();
  return String(v||'').trim();
}
function numberFrom(v){
  if(v===null || v===undefined || v==='') return 0;
  if(typeof v==='number') return Number.isFinite(v)?v:0;
  const m=String(v).replace(/,/g,'').match(/[0-9]+(?:\.[0-9]+)?/g);
  if(!m) return 0;
  const nums=m.map(Number).filter(n=>Number.isFinite(n)&&n>0);
  return nums.length?Math.min(...nums):0;
}
function pickPrice(p){
  const scalar=[p?.price,p?.min_price,p?.minPrice,p?.fob_price,p?.fobPrice,p?.reference_price,p?.referencePrice,p?.promotion_price,p?.promotionPrice,p?.wholesale_trade?.price,p?.wholesaleTrade?.price,p?.priceInfo?.price,p?.price_info?.price,p?.product?.wholesale_trade?.price,p?.result?.product?.wholesale_trade?.price];
  const nested=[p?.price_range,p?.priceRange,p?.price_ranges,p?.priceRanges,p?.wholesale_trade?.price_ranges,p?.wholesaleTrade?.priceRanges,p?.product?.wholesale_trade?.price_ranges,p?.sku_infos,p?.skuInfos,p?.product_sku_infos,p?.productSkuInfos];
  const vals=[];
  for(const v of scalar){ const n=numberFrom(v); if(n>0) vals.push(n); }
  for(const obj of nested){
    const arr=Array.isArray(obj)?obj:[obj];
    for(const x of arr){ const n=numberFrom(x?.price ?? x?.min_price ?? x?.minPrice ?? x?.sale_price ?? x?.salePrice ?? x?.fob_price ?? x?.fobPrice ?? x); if(n>0) vals.push(n); }
  }
  return vals.length?Math.min(...vals):0;
}
function productArray(data){
  const keys=['products','product','product_list','productList','items','item_list','data','list','result_list','productInfos','product_infos','offerList','offer_list'];
  const seen=new Set();
  function scoreItem(x){
    if(!x || typeof x!=='object') return 0;
    let s=0;
    if(pid(x)) s+=3;
    if(pickImage(x)) s+=2;
    if(pickPrice(x)>0) s+=2;
    if(x.subject||x.name||x.title||x.product_name||x.productName) s+=2;
    return s;
  }
  function walk(node, depth=0){
    if(!node || depth>7) return [];
    if(Array.isArray(node)){
      const obj=node.filter(x=>x && typeof x==='object');
      if(obj.length && obj.some(x=>scoreItem(x)>=3)) return obj;
      for(const x of obj){ const r=walk(x, depth+1); if(r.length) return r; }
      return [];
    }
    if(typeof node==='object'){
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
  return data?.result?.product || data?.product || data?.alibaba_icbu_product_get_response?.result?.product || data?.alibaba_icbu_product_get_response?.product || null;
}
function pid(p){return p?.id || p?.product_id || p?.productId || p?.offer_id || p?.offerId || p?.offerIdStr || p?.product_id_str || p?.encrypted_id || p?.encryptedId || '';}
function normalizeProduct(p,idx,q){
  const id=pid(p) || `ali-${idx}`;
  const name=p?.subject || p?.name || p?.title || p?.product_name || p?.productName || `Alibaba ${translate(q)}`;
  const price=pickPrice(p);
  const image=pickImage(p);
  const url=p?.pc_detail_url || p?.pcDetailUrl || p?.detail_url || p?.detailUrl || p?.url || ('https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)));
  return {id:`alibaba-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,alibabaProductId:String(id),sku:`ALI-${String(id).slice(0,24)}`,name,title:name,price:Number(price.toFixed(2)),cjProductCost:Number(price.toFixed(2)),provider:'Alibaba',proveedor:'Alibaba',vendor:'Alibaba',providerLogo:'🇨🇳',category:p?.category_id||p?.categoryId||'Alibaba',stock:'Verificar MOQ, stock y envío con Alibaba',shippingAmazon:0,cjShippingCost:0,vendorFee:0,cjHandlingFee:0,sourceUrl:url,url,originalProviderUrl:url,image,source:'alibaba-open-platform-real',owner:p?.owner_member_display_name||p?.ownerMemberDisplayName||'',features:'Producto real de Alibaba Open Platform. Confirmar MOQ, precio final, stock y envío antes de comprar.'};
}
async function callRouter(apiName, extra){
  const routers=(process.env.ALIBABA_ROUTER_URLS || 'https://eco.taobao.com/router/rest,https://gw.api.taobao.com/router/rest,https://openapi.alibaba.com/router/rest,https://api.alibaba.com/router/rest,https://gw.open.alibaba.com/router/rest').split(',').map(s=>s.trim()).filter(Boolean);
  const apiFields=['method','apiName','api_name','api','path'];
  const signMethods=['hmac','md5','sha256'];
  const attempts=[];
  for(const router of routers){
    for(const field of apiFields){
      for(const signMethod of signMethods){
        for(const includeAccessToken of [false,true]){
          const params=baseParams(apiName,extra,field,signMethod,includeAccessToken);
          const qs=new URLSearchParams(params).toString();
          try{
            const postOut=await fetchText(router,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded;charset=utf-8'},body:qs});
            attempts.push({router,field,signMethod,includeAccessToken,method:'POST',status:postOut.status,body:(postOut.text||'').slice(0,220)});
            if(postOut.ok && postOut.data && !String(postOut.text||'').includes('Invalid signature')) return {ok:true,data:postOut.data,attempts};
          }catch(e){attempts.push({router,field,signMethod,includeAccessToken,method:'POST',error:String(e.message||e)});}
          try{
            const getOut=await fetchText(router+'?'+qs);
            attempts.push({router,field,signMethod,includeAccessToken,method:'GET',status:getOut.status,body:(getOut.text||'').slice(0,220)});
            if(getOut.ok && getOut.data && !String(getOut.text||'').includes('Invalid signature')) return {ok:true,data:getOut.data,attempts};
          }catch(e){attempts.push({router,field,signMethod,includeAccessToken,method:'GET',error:String(e.message||e)});}
        }
      }
    }
  }
  return {ok:false,attempts};
}
async function callDirect(path, extra){
  const bases=(process.env.ALIBABA_API_BASES || 'https://openapi.alibaba.com,https://api.alibaba.com,https://gw.open.alibaba.com,https://eco.taobao.com,https://gw.api.taobao.com').split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=[];
  for(const base of bases){
    const params={app_key:appKey(),access_token:token(),...extra};
    const url=base.replace(/\/$/,'')+path+'?'+new URLSearchParams(params).toString();
    try{ const out=await fetchText(url); attempts.push({base,path,status:out.status,body:(out.text||'').slice(0,220)}); if(out.ok&&out.data) return {ok:true,data:out.data,attempts}; }
    catch(e){ attempts.push({base,path,error:String(e.message||e)}); }
  }
  return {ok:false,attempts};
}
async function listProducts(q,size){
  const subject=translate(q);
  const pageSize=String(Math.min(size,30));
  const requestJson=JSON.stringify({currentPage:1,pageSize:Number(pageSize),keywords:subject,subject,query:subject});
  const variants=[
    {current_page:'1',page_size:pageSize,subject,language:'ENGLISH'},
    {currentPage:'1',pageSize:pageSize,subject,language:'ENGLISH'},
    {current_page:'1',page_size:pageSize,keywords:subject,language:'ENGLISH'},
    {currentPage:'1',pageSize:pageSize,keywords:subject,language:'ENGLISH'},
    {page:'1',pageSize:pageSize,keyword:subject,language:'ENGLISH'},
    {pageNo:'1',pageSize:pageSize,query:subject,language:'ENGLISH'},
    {product_list_request:requestJson},
    {productListRequest:requestJson},
    {product_search_request:requestJson},
    {productSearchRequest:requestJson}
  ];
  const apiNames=['/alibaba/icbu/product/list','alibaba.icbu.product.list','alibaba.icbu.product.search','/icbu/product/list'];
  const attempts=[];
  for(const extra of variants){
    for(const apiName of apiNames){ const r=await callRouter(apiName,extra); attempts.push(...(r.attempts||[])); if(r.ok){ const arr=productArray(r.data); if(arr.length) return {ok:true,products:arr,raw:r.data,attempts}; }}
    for(const path of ['/alibaba/icbu/product/list','/icbu/product/list','/api/alibaba/icbu/product/list']){ const r=await callDirect(path,extra); attempts.push(...(r.attempts||[])); if(r.ok){ const arr=productArray(r.data); if(arr.length) return {ok:true,products:arr,raw:r.data,attempts}; }}
  }
  return {ok:false,products:[],attempts};
}
async function getProductDetail(id){
  if(!id) return null;
  const req=JSON.stringify({product_id:String(id),productId:String(id),language:'ENGLISH'});
  const extra={product_get_request:req, product_id:String(id), productId:String(id), id:String(id), language:'ENGLISH'};
  const apiNames=['/icbu/product/get','alibaba.icbu.product.get'];
  for(const apiName of apiNames){ const r=await callRouter(apiName,extra); if(r.ok){ const obj=productObject(r.data); if(obj) return obj; }}
  for(const path of ['/icbu/product/get','/alibaba/icbu/product/get']){ const r=await callDirect(path,extra); if(r.ok){ const obj=productObject(r.data); if(obj) return obj; }}
  return null;
}

export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS') return res.status(200).end(); if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.keyword||'').trim(); const maxPrice=parseMax(req.query.maxPrice||req.query.max||0); const size=Math.min(Math.max(Number(req.query.size||15),1),30);
  const ak=appKey(), secret=appSecret(), tk=token();
  if(!ak || !secret || !tk) return res.status(200).json({ok:false,provider:'Alibaba',products:[],message:'Faltan variables Alibaba en Vercel.',seen:{ALIBABA_APP_KEY:Boolean(ak),ALIBABA_APP_SECRET:Boolean(secret),ALIBABA_ACCESS_TOKEN:Boolean(tk), acceptedNames:['ALIBABA_APP_KEY/ALIBABA_CLIENT_ID','ALIBABA_APP_SECRET/ALIBABA_CLIENT_SECRET','ALIBABA_ACCESS_TOKEN/ALIBABA_TOKEN/ALIBABA_SESSION']}});
  const listed=await listProducts(q,size);
  let rawItems=listed.products || [];
  const enriched=[];
  for(const item of rawItems.slice(0,15)){
    let merged=item;
    const n0=normalizeProduct(item,enriched.length,q);
    if((!n0.price || !n0.image) && pid(item)){
      const detail=await getProductDetail(pid(item));
      if(detail) merged={...item,...detail};
    }
    const n=normalizeProduct(merged,enriched.length,q);
    if(n.price>0) enriched.push(n);
  }
  let products=enriched;
  if(maxPrice>0) products=products.filter(p=>p.price<=maxPrice);
  products=products.sort((a,b)=>a.price-b.price).slice(0,15);
  return res.status(200).json({
    ok:products.length>0,
    provider:'Alibaba',
    mode:'alibaba_real_list_then_get',
    endpoint:'/alibaba/icbu/product/list + /icbu/product/get',
    count:products.length,
    products,
    message:products.length?'Productos reales Alibaba devueltos.':'Alibaba no devolvió productos reales con precio. No se muestran productos ni fotos de prueba.',
    diagnostic:products.length?undefined:{reason:listed.ok?'list_without_price':'list_empty_or_unreachable', attempts:(listed.attempts||[]).slice(-20)}
  });
}
