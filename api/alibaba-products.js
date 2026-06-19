// nexo™ – Alibaba Product Search API
// Usa Alibaba Open Platform real: /alibaba/icbu/product/list.
// No usa ALIBABA_PRODUCT_IDS. No genera productos ni imágenes de prueba.

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

function hasRealImage(p){
  return !!(p?.main_image?.images?.[0] || p?.mainImage?.images?.[0] || p?.image || p?.image_url || p?.picture_url);
}
async function tryAlibabaGet(id){
  const appKey=process.env.ALIBABA_APP_KEY||''; const token=process.env.ALIBABA_ACCESS_TOKEN||'';
  if(!appKey || !token || !id) return null;
  const paths=['/icbu/product/get','/alibaba/icbu/product/get'];
  const bases=(process.env.ALIBABA_API_BASES||'https://openapi.alibaba.com/router/rest,https://openapi.alibaba.com').split(',').map(s=>s.trim()).filter(Boolean);
  for(const base of bases){
    for(const path of paths){
      try{
        const url=base.includes('router/rest')?base:base.replace(/\/$/,'')+'/router/rest';
        const params=new URLSearchParams({method:path,api_name:path,app_key:appKey,access_token:token,product_get_request:JSON.stringify({productId:String(id)})});
        const r=await fetch(url+'?'+params.toString(),{method:'GET',cache:'no-store'});
        if(!r.ok) continue;
        const data=await r.json().catch(()=>null);
        const result=data?.result || data?.alibaba_icbu_product_get_response?.product || data?.alibaba_icbu_product_get_response?.result || data?.response?.result || data;
        const product=result?.product || result;
        if(product && typeof product==='object') return product;
      }catch(e){}
    }
  }
  return null;
}
function pickImage(p){return p?.main_image?.images?.[0] || p?.mainImage?.images?.[0] || p?.image || p?.image_url || p?.picture_url || ''}
function pickPrice(p){const vals=[p?.price,p?.min_price,p?.fob_price,p?.wholesale_trade?.price,p?.wholesaleTrade?.price,p?.reference_price].map(Number).filter(Number.isFinite); return vals.length?Math.min(...vals):0;}
function normalizeProduct(p,idx,q,maxPrice){
  const id=p?.id || p?.product_id || p?.productId || `ali-${idx}`;
  const name=p?.subject || p?.name || p?.title || `Alibaba ${translate(q)}`;
  const rawPrice=pickPrice(p); const price=rawPrice>0?rawPrice:0;
  const url=p?.pc_detail_url || p?.detail_url || p?.url || ('https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)));
  return {id:`alibaba-${id}`, alibabaProductId:String(id), sku:`ALI-${id}`, name, title:name, price:Number(price.toFixed(2)), cjProductCost:Number(price.toFixed(2)), provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳', category:p?.category_id || 'Alibaba', stock:'Verificar MOQ, stock y envío con Alibaba', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0, sourceUrl:url, url, image:pickImage(p), source:'alibaba-icbu-product-list', owner:p?.owner_member_display_name || '', features:'Producto Alibaba Open Platform. Confirmar MOQ, precio final, stock y envío antes de comprar.'};
}
function flattenProducts(result){
  const candidates=[result?.products,result?.product_list,result?.productList,result?.data,result?.result?.products,result?.result?.product_list,result?.result?.productList,result?.result?.data,result?.result?.items,result?.items];
  for(const c of candidates){ if(Array.isArray(c)) return c; }
  if(result?.result && typeof result.result==='object'){
    for(const v of Object.values(result.result)){ if(Array.isArray(v)) return v; }
  }
  return [];
}
async function tryAlibabaList(q,size){
  const appKey=process.env.ALIBABA_APP_KEY||''; const token=process.env.ALIBABA_ACCESS_TOKEN||'';
  if(!appKey || !token) return {ok:false, reason:'missing_alibaba_env'};
  const subject=translate(q);
  const attempts=[];
  const paths=['/alibaba/icbu/product/list','/icbu/product/list'];
  const bases=(process.env.ALIBABA_API_BASES||'https://openapi.alibaba.com/router/rest,https://openapi.alibaba.com').split(',').map(s=>s.trim()).filter(Boolean);
  for(const base of bases){
    for(const path of paths){
      try{
        const url=base.includes('router/rest')?base:base.replace(/\/$/,'')+'/router/rest';
        const params=new URLSearchParams({method:path,api_name:path,app_key:appKey,access_token:token,current_page:'1',page_size:String(Math.min(size,30)),subject});
        const r=await fetch(url+'?'+params.toString(),{method:'GET',cache:'no-store'});
        const txt=await r.text(); attempts.push({path,status:r.status,body:txt.slice(0,240)});
        if(r.ok){
          let data; try{data=JSON.parse(txt);}catch(e){continue;}
          const result=data?.result || data?.alibaba_icbu_product_list_response?.result || data?.response?.result || data;
          const arr=flattenProducts(result);
          if(Array.isArray(arr) && arr.length) return {ok:true, products:arr, raw:result, path};
        }
      }catch(e){attempts.push({path,error:String(e.message||e)});}
    }
  }
  return {ok:false, reason:'empty_or_unreachable', attempts};
}
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS') return res.status(200).end(); if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.keyword||'').trim(); const maxPrice=parseMax(req.query.maxPrice||req.query.max||0); const size=Math.min(Math.max(Number(req.query.size||15),1),30);
  const real=await tryAlibabaList(q,size);
  let rows=[];
  if(real.ok){
    for(const item of real.products.slice(0, Math.min(size,30))){
      const id=item?.id || item?.product_id || item?.productId;
      const detail = await tryAlibabaGet(id);
      rows.push(detail ? {...item, ...detail} : item);
    }
  }
  let products=rows.map((p,i)=>normalizeProduct(p,i,q,maxPrice))
    .filter(p=>p.price>0 && p.image && (!maxPrice || p.price<=maxPrice));
  products.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
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
