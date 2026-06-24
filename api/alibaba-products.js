// nexo™ – Alibaba Product Search API REAL ONLY
// Usa Alibaba Open Platform. No genera productos, precios ni fotos de prueba.
// Ordena de menor a mayor y devuelve máximo 15 productos reales con imagen y precio.

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
  const map={calcetin:'socks',calcetines:'socks',medias:'socks',media:'socks',zapato:'shoes',zapatos:'shoes',zapatillas:'sneakers',tenis:'sneakers',cordon:'shoelaces',cordones:'shoelaces',camisa:'shirts',camisas:'shirts',polera:'t shirts',poleras:'t shirts',pantalon:'pants',pantalones:'pants',mochila:'backpack',mochilas:'backpack',celular:'phone',telefono:'phone',reloj:'watch',relojes:'watch',audifonos:'earbuds',auriculares:'earbuds',laptop:'laptop'};
  return map[key] || q || 'product';
}
function appKey(){return process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY || '';}
function appSecret(){return process.env.ALIBABA_APP_SECRET || process.env.ALIBABA_APPSECRET || '';}
function token(){return process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN || '';}
function hmacSha256Hex(secret, text){return crypto.createHmac('sha256', secret).update(text, 'utf8').digest('hex').toUpperCase();}
function signTopParams(params, secret){
  const keys=Object.keys(params).filter(k=>params[k]!==undefined && params[k]!==null).sort();
  const base=keys.map(k=>`${k}${params[k]}`).join('');
  return hmacSha256Hex(secret, base);
}
function pickImage(p){
  const candidates=[
    p?.main_image?.images?.[0], p?.mainImage?.images?.[0], p?.main_image?.url, p?.mainImage?.url,
    p?.image, p?.image_url, p?.imageUrl, p?.picture_url, p?.pictureUrl, p?.thumbnail, p?.thumb_url,
    Array.isArray(p?.images)?p.images[0]:null, Array.isArray(p?.product_images)?p.product_images[0]:null
  ];
  return String(candidates.find(Boolean)||'').trim();
}
function pickPrice(p){
  const scalar=[p?.price,p?.min_price,p?.minPrice,p?.fob_price,p?.fobPrice,p?.reference_price,p?.referencePrice,p?.wholesale_trade?.price,p?.wholesaleTrade?.price,p?.priceInfo?.price,p?.price_info?.price];
  const nested=[p?.price_range,p?.priceRange,p?.price_ranges,p?.priceRanges,p?.wholesale_trade?.price_ranges,p?.wholesaleTrade?.priceRanges];
  const vals=[];
  for(const v of scalar){ const n=Number(String(v??'').replace(/[^0-9.]/g,'')); if(Number.isFinite(n)&&n>0) vals.push(n); }
  for(const obj of nested){
    const arr=Array.isArray(obj)?obj:[obj];
    for(const x of arr){
      const n=Number(String(x?.price ?? x?.min_price ?? x?.minPrice ?? x).replace(/[^0-9.]/g,''));
      if(Number.isFinite(n)&&n>0) vals.push(n);
    }
  }
  return vals.length?Math.min(...vals):0;
}
function productArray(data){
  const roots=[data, data?.result, data?.response, data?.alibaba_icbu_product_list_response?.result, data?.alibaba_icbu_product_list_response, data?.alibaba_icbu_product_get_response?.result, data?.alibaba_icbu_product_get_response];
  const keys=['products','product','product_list','productList','items','item_list','data','list','result_list'];
  for(const root of roots){
    if(!root || typeof root!=='object') continue;
    if(Array.isArray(root)) return root;
    for(const k of keys){ if(Array.isArray(root[k])) return root[k]; }
    for(const v of Object.values(root)){ if(Array.isArray(v)) return v; }
  }
  return [];
}
function normalizeProduct(p,idx,q){
  const id=p?.id || p?.product_id || p?.productId || p?.offer_id || p?.offerId || `ali-${idx}`;
  const name=p?.subject || p?.name || p?.title || p?.product_name || p?.productName || `Alibaba ${translate(q)}`;
  const price=pickPrice(p);
  const image=pickImage(p);
  const url=p?.pc_detail_url || p?.pcDetailUrl || p?.detail_url || p?.detailUrl || p?.url || ('https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)));
  return {
    id:`alibaba-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`, alibabaProductId:String(id), sku:`ALI-${String(id).slice(0,24)}`,
    name, title:name, price:Number(price.toFixed(2)), cjProductCost:Number(price.toFixed(2)),
    provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳', category:p?.category_id || p?.categoryId || 'Alibaba',
    stock:'Verificar MOQ, stock y envío con Alibaba', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    sourceUrl:url, url, originalProviderUrl:url, image, source:'alibaba-open-platform-real', owner:p?.owner_member_display_name || p?.ownerMemberDisplayName || '',
    features:'Producto real de Alibaba Open Platform. Confirmar MOQ, precio final, stock y envío antes de comprar.'
  };
}
async function getJson(url, opts={}){
  const r=await fetch(url, {...opts, cache:'no-store'});
  const txt=await r.text();
  let data=null; try{data=JSON.parse(txt);}catch(e){}
  return {ok:r.ok, status:r.status, text:txt, data};
}
function topParams(apiName, extra){
  const params={
    method:apiName,
    app_key:appKey(),
    session:token(),
    access_token:token(),
    timestamp:new Date().toISOString().slice(0,19).replace('T',' '),
    format:'json', v:'2.0', sign_method:'sha256',
    ...extra
  };
  params.sign=signTopParams(params, appSecret());
  return params;
}
async function callAlibabaList(q,size){
  const ak=appKey(), secret=appSecret(), tk=token();
  if(!ak || !secret || !tk) return {ok:false, reason:'missing_alibaba_env', seen:{ALIBABA_APP_KEY:Boolean(ak), ALIBABA_APP_SECRET:Boolean(secret), ALIBABA_ACCESS_TOKEN:Boolean(tk)}};
  const subject=translate(q);
  const attempts=[];
  const apiNames=['/alibaba/icbu/product/list','alibaba.icbu.product.list','/icbu/product/list'];

  // 1) TOP router style, signed. Alibaba docs usan request.setApiName(...), no una URL REST simple.
  const routers=(process.env.ALIBABA_ROUTER_URLS || 'https://openapi.alibaba.com/router/rest,https://api.alibaba.com/router/rest,https://gw.open.alibaba.com/router/rest').split(',').map(s=>s.trim()).filter(Boolean);
  for(const router of routers){
    for(const apiName of apiNames){
      try{
        const params=topParams(apiName,{current_page:'1', page_size:String(Math.min(size,30)), subject});
        const url=router+'?'+new URLSearchParams(params).toString();
        const out=await getJson(url);
        attempts.push({mode:'router', router, apiName, status:out.status, body:(out.text||'').slice(0,300)});
        if(out.ok && out.data){
          const arr=productArray(out.data);
          if(arr.length) return {ok:true, products:arr, mode:'router', router, apiName, raw:out.data};
        }
      }catch(e){attempts.push({mode:'router', router, apiName, error:String(e.message||e)});}
    }
  }

  // 2) Direct path style, only as fallback. En tu prueba devolvió 404, pero se conserva como diagnóstico.
  const directBases=(process.env.ALIBABA_API_BASES || 'https://openapi.alibaba.com,https://api.alibaba.com,https://gw.open.alibaba.com').split(',').map(s=>s.trim()).filter(Boolean);
  const directPaths=['/alibaba/icbu/product/list','/icbu/product/list','/api/alibaba/icbu/product/list'];
  for(const base of directBases){
    for(const path of directPaths){
      try{
        const url=base.replace(/\/$/,'')+path+'?'+new URLSearchParams({app_key:ak, access_token:tk, current_page:'1', page_size:String(Math.min(size,30)), subject}).toString();
        const out=await getJson(url);
        attempts.push({mode:'direct', path, status:out.status, body:(out.text||'').slice(0,300)});
        if(out.ok && out.data){ const arr=productArray(out.data); if(arr.length) return {ok:true, products:arr, mode:'direct', path, raw:out.data}; }
      }catch(e){attempts.push({mode:'direct', path, error:String(e.message||e)});}
    }
  }
  return {ok:false, reason:'empty_or_unreachable', attempts};
}

export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS') return res.status(200).end(); if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.keyword||'').trim(); const maxPrice=parseMax(req.query.maxPrice||req.query.max||0); const size=Math.min(Math.max(Number(req.query.size||15),1),30);
  const real=await callAlibabaList(q,size);
  let products=[];
  if(real.ok){
    products=real.products.map((p,i)=>normalizeProduct(p,i,q)).filter(p=>p.price>0 && p.image);
    if(maxPrice>0) products=products.filter(p=>p.price<=maxPrice);
    products=products.sort((a,b)=>a.price-b.price).slice(0,15);
  }
  return res.status(200).json({
    ok:products.length>0,
    provider:'Alibaba',
    mode:'alibaba_icbu_product_list_real_only',
    endpoint:'/alibaba/icbu/product/list',
    count:products.length,
    products,
    message:products.length?'Productos reales Alibaba devueltos.':'Alibaba no devolvió productos reales con imagen y precio. No se muestran productos ni fotos de prueba.',
    diagnostic:products.length?undefined:real
  });
}
