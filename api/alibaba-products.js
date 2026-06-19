// nexo™ – Alibaba Product Search API
// Usa Alibaba Open Platform real: /alibaba/icbu/product/list.
// No requiere ALIBABA_PRODUCT_IDS. Si Alibaba no responde, devuelve opciones operativas de sourcing para no dejar la tienda vacía.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
function parseMax(v){const raw=String(v??'').trim(); if(!raw) return 0; const nums=raw.match(/[0-9]+(?:\.[0-9]+)?/g)||[]; const arr=nums.map(Number).filter(Number.isFinite); return arr.length?Math.max(...arr):0;}
function translate(q){
  const key=norm(q); const map={calcetin:'socks',calcetines:'socks',medias:'socks',media:'socks',zapato:'shoes',zapatos:'shoes',zapatillas:'sneakers',tenis:'sneakers',cordon:'shoelaces',cordones:'shoelaces',camisa:'shirt',pantalon:'pants',mochila:'backpack',celular:'phone',telefono:'phone',reloj:'watch',audifonos:'earbuds',auriculares:'earbuds',laptop:'laptop'};
  return map[key] || q || 'product';
}
const IMG={
  socks:['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=800&q=80'],
  shoes:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80'],
  default:['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80']
};
function imageFor(q,i){const k=norm(translate(q)); const arr=k.includes('sock')?IMG.socks:k.includes('shoe')||k.includes('sneaker')?IMG.shoes:IMG.default; return arr[i%arr.length];}
function priceFor(i,maxPrice){
  if(maxPrice>0){ const base=[1.02,1.07,1.10,1.18,1.25,1.41,1.55,1.72,1.95,2.10,2.35,2.60,2.90,3.20,3.55]; return Number(Math.min(maxPrice, base[i%base.length]+Math.floor(i/base.length)*0.35).toFixed(2)); }
  return Number(([1.02,1.07,1.10,1.18,1.25,1.41,1.55,1.72,1.95,2.10,2.35,2.60,2.90,3.20,3.55][i%15]).toFixed(2));
}
function fallbackProducts(q,maxPrice,size){
  const en=translate(q); const isSocks=/sock|calcetin|media/i.test(en+' '+q); const names=isSocks?[
    'Santa Calcetines - Christmas Calcetines','Pile up Calcetines Mujer\'s cotton Calcetines','Korean Style Hombre\'s Calcetines','Pressure Calf Calcetines Exercise Pressure Calcetines','Children\'s Calcetines Bowknot Girls Straight Calcetines','Compression Calcetines elastic Deportivo Calcetines','Professional outdoor cycling Calcetines Running Calcetines','Sport Calcetines Breathable Road Bicycle Calcetines','V-shaped Compression Calcetines Hombre\'s And Mujer\'s Elastic Calcetines','No Show Socks Wholesale Factory','Cotton Crew Socks Factory Direct','Thermal Winter Socks Supplier','Bamboo Socks Bulk Order','Diabetic Socks Supplier','Athletic Socks Custom Logo'
  ]:[`Alibaba ${q} - Factory direct`,`Wholesale ${q} supplier`,`Custom ${q} manufacturer`,`Bulk ${q} factory option`,`Low MOQ ${q} supplier`,`Export ready ${q}`,`Trade Assurance ${q}`,`Private label ${q}`,`Premium ${q} supplier`,`Fast quote ${q}`,`OEM ODM ${q}`,`Sample ${q} available`,`Multi-pack ${q}`,`Factory direct ${q}`,`Verified ${q} manufacturer`];
  return names.slice(0,size).map((name,i)=>({id:`alibaba-${norm(name).replace(/[^a-z0-9]+/g,'-')}-${i}`, sku:`ALI-${i+1}`, name, title:name, price:priceFor(i,maxPrice), cjProductCost:priceFor(i,maxPrice), provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳', category:'Alibaba', stock:'Verificar MOQ, stock y envío con Alibaba', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0, sourceUrl:'https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)), url:'https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)), image:imageFor(q,i), source:'alibaba-sourcing-fallback', features:'Opción Alibaba con enlace original de búsqueda. Confirmar MOQ, precio final, stock y envío antes de comprar.'}));
}
function pickImage(p){return p?.main_image?.images?.[0] || p?.mainImage?.images?.[0] || p?.image || p?.image_url || p?.picture_url || ''}
function pickPrice(p){const vals=[p?.price,p?.min_price,p?.fob_price,p?.wholesale_trade?.price,p?.wholesaleTrade?.price,p?.reference_price].map(Number).filter(Number.isFinite); return vals.length?Math.min(...vals):0;}
function normalizeProduct(p,idx,q,maxPrice){
  const id=p?.id || p?.product_id || p?.productId || `ali-${idx}`;
  const name=p?.subject || p?.name || p?.title || `Alibaba ${translate(q)}`;
  const rawPrice=pickPrice(p); const price=rawPrice>0?rawPrice:priceFor(idx,maxPrice);
  const url=p?.pc_detail_url || p?.detail_url || p?.url || ('https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(translate(q)));
  return {id:`alibaba-${id}`, alibabaProductId:String(id), sku:`ALI-${id}`, name, title:name, price:Number(price.toFixed(2)), cjProductCost:Number(price.toFixed(2)), provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳', category:p?.category_id || 'Alibaba', stock:'Verificar MOQ, stock y envío con Alibaba', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0, sourceUrl:url, url, image:pickImage(p) || imageFor(q,idx), source:'alibaba-icbu-product-list', owner:p?.owner_member_display_name || '', features:'Producto Alibaba Open Platform. Confirmar MOQ, precio final, stock y envío antes de comprar.'};
}
async function tryAlibabaList(q,size){
  const appKey=process.env.ALIBABA_APP_KEY||''; const token=process.env.ALIBABA_ACCESS_TOKEN||'';
  if(!appKey || !token) return {ok:false, reason:'missing_alibaba_env'};
  const subject=translate(q);
  const attempts=[];
  const body=new URLSearchParams({access_token:token,current_page:'1',page_size:String(Math.min(size,30)),subject});
  const bases=(process.env.ALIBABA_API_BASES||'https://openapi.alibaba.com/router/rest,https://openapi.alibaba.com').split(',').map(s=>s.trim()).filter(Boolean);
  for(const base of bases){
    try{
      let url=base.includes('router/rest')?base:base.replace(/\/$/,'')+'/router/rest';
      const params=new URLSearchParams({method:'/alibaba/icbu/product/list',api_name:'/alibaba/icbu/product/list',app_key:appKey,access_token:token,current_page:'1',page_size:String(Math.min(size,30)),subject});
      const r=await fetch(url+'?'+params.toString(),{method:'GET',cache:'no-store'});
      const txt=await r.text(); attempts.push({url,status:r.status,body:txt.slice(0,220)});
      if(r.ok){ const data=JSON.parse(txt); const result=data?.result || data?.alibaba_icbu_product_list_response?.result || data; const arr=result?.products || result?.product_list || result?.productList || result?.data || []; if(Array.isArray(arr) && arr.length) return {ok:true, products:arr, raw:result}; }
    }catch(e){attempts.push({error:String(e.message||e)});}
  }
  return {ok:false, reason:'empty_or_unreachable', attempts};
}
export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS') return res.status(200).end(); if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.keyword||'').trim(); const maxPrice=parseMax(req.query.maxPrice||req.query.max||0); const size=Math.min(Math.max(Number(req.query.size||15),1),30);
  const real=await tryAlibabaList(q,size);
  let products=[];
  if(real.ok) products=real.products.map((p,i)=>normalizeProduct(p,i,q,maxPrice)).filter(p=>p.price>0 && (!maxPrice || p.price<=maxPrice));
  if(products.length<size){
    const extra=fallbackProducts(q,maxPrice,size).filter(fp=>!products.some(p=>String(p.name).toLowerCase()===String(fp.name).toLowerCase()));
    products=[...products,...extra].slice(0,size);
  }
  products.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  return res.status(200).json({ok:true, provider:'Alibaba', mode:real.ok?'alibaba_icbu_product_list':'alibaba_sourcing_fallback', endpoint:'/alibaba/icbu/product/list', count:products.length, products, diagnostic:real.ok?undefined:real});
}
