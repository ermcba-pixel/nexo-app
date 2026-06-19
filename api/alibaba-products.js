// nexo™ – Alibaba Product Search API
// Usa Alibaba Open Platform real: /alibaba/icbu/product/list.
// No usa ALIBABA_PRODUCT_IDS. Si la API real no devuelve filas, responde 15 opciones operativas de sourcing
// con enlaces de búsqueda de Alibaba para mantener el flujo comercial sin mezclar proveedores.

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
const IMG={
  socks:['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=800&q=80'],
  shoes:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80'],
  shirts:['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'],
  bags:['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'],
  default:['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80']
};
function imageFor(q,i){const k=norm(translate(q)+' '+q); const arr=k.includes('sock')||k.includes('calcetin')?IMG.socks:k.includes('shoe')||k.includes('sneaker')||k.includes('zapato')?IMG.shoes:k.includes('shirt')||k.includes('camisa')||k.includes('polera')?IMG.shirts:k.includes('mochila')||k.includes('bag')?IMG.bags:IMG.default; return arr[i%arr.length];}
function priceFor(i,maxPrice){
  const base=[1.02,1.07,1.10,1.18,1.25,1.29,1.35,1.45,1.55,1.72,1.95,2.10,2.35,2.60,2.90];
  if(maxPrice>0){
    const safe = Math.max(0.25, maxPrice);
    const val = Math.min(safe, Math.max(0.25, safe * (0.62 + (i%15)*0.025)));
    return Number(val.toFixed(2));
  }
  return Number(base[i%base.length].toFixed(2));
}
function namesFor(q){
  const k=norm(q), en=translate(q);
  if(/sock|calcetin|media/.test(k+' '+en)) return ['Cotton Socks Factory Direct','Sports Socks Wholesale','Compression Socks Bulk MOQ','Children Socks Supplier','Dress Socks Factory','No Show Socks Manufacturer','Bamboo Socks Export','Thermal Socks Supplier','Athletic Socks Bulk','Private Label Socks','Diabetic Socks Supplier','Crew Socks Wholesale','Custom Logo Socks','Ankle Socks Factory','Work Socks Supplier'];
  if(/shirt|camisa|polera|t shirt/.test(k+' '+en)) return ['Cotton Shirts Factory Direct','Men Casual Shirts Wholesale','Women Blouse Supplier','Polo Shirts Bulk MOQ','T Shirts Custom Logo','Oxford Shirts Manufacturer','Work Shirts Factory','Kids Shirts Wholesale','Denim Shirts Supplier','Linen Shirts Export','Printed Shirts OEM','Long Sleeve Shirts Bulk','Short Sleeve Shirts MOQ','Uniform Shirts Supplier','Private Label Shirts'];
  if(/shoe|sneaker|zapato|zapatilla/.test(k+' '+en)) return ['Sneakers Factory Direct','Casual Shoes Wholesale','Sports Shoes Supplier','Walking Shoes Bulk MOQ','Women Shoes Manufacturer','Kids Shoes Factory','Leather Shoes Supplier','Running Shoes Wholesale','Safety Shoes Export','Private Label Shoes','Canvas Shoes Supplier','Outdoor Shoes Factory','Sandals Wholesale','Boots Manufacturer','Low MOQ Shoes'];
  return [`${q} Factory Direct`,`${q} Wholesale Supplier`,`${q} Custom Manufacturer`,`${q} Bulk MOQ`,`${q} Export Ready`,`${q} Trade Assurance`,`${q} Private Label`,`${q} OEM ODM`,`${q} Premium Supplier`,`${q} Fast Quote`,`${q} Sample Available`,`${q} Multi Pack`,`${q} Factory Option`,`${q} Verified Manufacturer`,`${q} Sourcing Option`];
}
function fallbackProducts(q,maxPrice,size){
  const en=translate(q); const names=namesFor(q||en);
  return names.slice(0,size).map((name,i)=>({
    id:`alibaba-${norm(name).replace(/[^a-z0-9]+/g,'-')}-${i}`, sku:`ALI-${i+1}`, name, title:name,
    price:priceFor(i,maxPrice), cjProductCost:priceFor(i,maxPrice),
    provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳', category:'Alibaba',
    stock:'Verificar MOQ, stock y envío con Alibaba', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    sourceUrl:'https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(en), url:'https://www.alibaba.com/trade/search?SearchText='+encodeURIComponent(en),
    image:imageFor(q,i), source:'alibaba-operativo-sourcing',
    features:'Opción Alibaba con enlace original de búsqueda. Confirmar MOQ, precio final, stock y envío antes de comprar.'
  }));
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
  let products=[];
  if(real.ok) products=real.products.map((p,i)=>normalizeProduct(p,i,q,maxPrice)).filter(p=>p.price>0 && (!maxPrice || p.price<=maxPrice));
  if(products.length<size){
    const extra=fallbackProducts(q,maxPrice,size).filter(fp=>!products.some(p=>String(p.name).toLowerCase()===String(fp.name).toLowerCase()));
    products=[...products,...extra].slice(0,size);
  }
  products.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  return res.status(200).json({ok:true, provider:'Alibaba', mode:real.ok?'alibaba_icbu_product_list':'alibaba_operativo_sourcing', endpoint:'/alibaba/icbu/product/list', count:products.length, products, diagnostic:real.ok?undefined:real});
}
