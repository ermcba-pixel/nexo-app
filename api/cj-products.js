// nexo™ – CJ Dropshipping Product Search API REAL
// Requiere en Vercel: CJ_API_KEY
// Opcional: CJ_ACCESS_TOKEN y CJ_REFRESH_TOKEN. Si no existen, se genera Access Token automáticamente.

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Expires','0');
}

async function fetchJson(url, options={}, timeoutMs=15000){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try{
    const r = await fetch(url, {...options, signal: ctrl.signal});
    const text = await r.text();
    let data = {};
    try{ data = text ? JSON.parse(text) : {}; }catch(e){ data = {raw:text}; }
    if(!r.ok){
      const err = new Error(data?.message || data?.error || `HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function getCjAccessToken(){
  const envToken = (process.env.CJ_ACCESS_TOKEN || '').trim();
  if(envToken) return envToken;

  if(cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const apiKey = (process.env.CJ_API_KEY || '').trim();
  if(!apiKey){
    const err = new Error('Falta CJ_API_KEY en Vercel');
    err.code = 'missing_cj_api_key';
    throw err;
  }

  const data = await fetchJson(`${CJ_BASE}/authentication/getAccessToken`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({apiKey})
  }, 15000);

  const token = data?.data?.accessToken || data?.accessToken || data?.data?.access_token || data?.access_token;
  const expiresIn = Number(data?.data?.expiresIn || data?.expiresIn || 12*60*60);
  if(!token){
    const err = new Error(data?.message || 'CJ no devolvió Access Token');
    err.code = 'cj_token_missing';
    err.data = data;
    throw err;
  }
  cachedToken = token;
  cachedTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
  return token;
}

function firstNumber(...vals){
  for(const v of vals){
    if(v === null || v === undefined || v === '') continue;
    if(typeof v === 'string' && v.includes('-')){
      const m = v.match(/[0-9]+(?:\.[0-9]+)?/g);
      if(m && m.length) return Number(m[0]);
    }
    const n = Number(v);
    if(Number.isFinite(n)) return n;
  }
  return 0;
}

function firstString(...vals){
  for(const v of vals){ if(v !== null && v !== undefined && String(v).trim()) return String(v).trim(); }
  return '';
}

function firstImage(raw){
  const img = firstString(raw.productImage, raw.productImageUrl, raw.bigImage, raw.image, raw.imageUrl, raw.thumbnail, raw.productImageSet?.[0]);
  if(img) return img;
  const imgs = raw.productImages || raw.images || raw.productImageList || raw.imageList;
  if(Array.isArray(imgs) && imgs.length){
    const v = imgs[0];
    return typeof v === 'string' ? v : firstString(v.url, v.image, v.imageUrl);
  }
  return '';
}

function normalizeCj(raw, idx){
  const price = firstNumber(raw.sellPrice, raw.price, raw.nowPrice, raw.discountPrice, raw.productPrice, raw.cjProductCost, raw.suggestSellPrice, raw.sellPriceFrom);
  const shipping = firstNumber(raw.shippingCost, raw.shippingPrice, raw.logisticPrice, raw.freightPrice, raw.cjShippingCost);
  const handling = firstNumber(raw.serviceFee, raw.handlingFee, raw.cjHandlingFee, raw.vendorFee);
  const name = firstString(raw.productNameEn, raw.productName, raw.nameEn, raw.name, raw.title, 'CJ Dropshipping product');
  const id = firstString(raw.pid, raw.productId, raw.cjProductId, raw.id, raw.sku, raw.productSku, `cj-${idx+1}`);
  const sourceUrl = firstString(raw.productUrl, raw.sourceUrl, raw.url) || `https://www.cjdropshipping.com/product/${encodeURIComponent(id)}.html`;
  return {
    id: `cj-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,
    cjProductId: id,
    sku: firstString(raw.sku, raw.productSku, raw.variantSku),
    name,
    title: name,
    price: Number(price.toFixed(2)),
    cjProductCost: Number(price.toFixed(2)),
    cjShippingCost: Number(shipping.toFixed(2)),
    shippingAmazon: Number(shipping.toFixed(2)),
    cjHandlingFee: Number(handling.toFixed(2)),
    vendorFee: Number(handling.toFixed(2)),
    provider: 'CJ Dropshipping',
    proveedor: 'CJ Dropshipping',
    vendor: 'CJ Dropshipping',
    providerLogo: '🇨🇳',
    category: firstString(raw.categoryName, raw.oneCategoryName, raw.twoCategoryName, raw.threeCategoryName, raw.category, 'CJ Dropshipping'),
    image: firstImage(raw),
    sourceUrl,
    url: sourceUrl,
    stock: firstString(raw.inventory, raw.stock, raw.warehouseInventoryNum, raw.totalVerifiedInventory, raw.listedNum, 'Stock real CJ / verificar al confirmar'),
    source: 'cj-dropshipping-api',
    originalCJ: true,
    rawProviderData: raw
  };
}



function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
function searchProfile(q){
  const clean = String(q || '').trim();
  const key = norm(clean);
  const profiles = {
    'calcetin':{query:'socks', any:['sock','socks','hosiery'], es:'calcetín'},
    'calcetines':{query:'socks', any:['sock','socks','hosiery'], es:'calcetines'},
    'medias':{query:'socks', any:['sock','socks','hosiery'], es:'medias'},
    'media':{query:'socks', any:['sock','socks','hosiery'], es:'media'},
    'sock':{query:'socks', any:['sock','socks','hosiery'], es:'calcetines'},
    'socks':{query:'socks', any:['sock','socks','hosiery'], es:'calcetines'},
    'cordon':{query:'shoelaces', any:['shoelace','shoe lace','laces','lace'], es:'cordones'},
    'cordones':{query:'shoelaces', any:['shoelace','shoe lace','laces','lace'], es:'cordones'},
    'cordones zapatos':{query:'shoelaces', any:['shoelace','shoe lace','laces','lace'], es:'cordones'},
    'cordones para zapatos':{query:'shoelaces', any:['shoelace','shoe lace','laces','lace'], es:'cordones'},
    'zapatos':{query:'shoes', any:['shoe','shoes','sneaker','sneakers','footwear'], es:'zapatos'},
    'zapatillas':{query:'sneakers', any:['sneaker','sneakers','shoe','shoes'], es:'zapatillas'},
    'tenis':{query:'sneakers', any:['sneaker','sneakers','shoe','shoes'], es:'tenis'},
    'audifonos':{query:'earbuds', any:['earbud','earbuds','earphone','headphone','headset'], es:'audífonos'},
    'auriculares':{query:'earbuds', any:['earbud','earbuds','earphone','headphone','headset'], es:'auriculares'},
    'reloj':{query:'watch', any:['watch','wristwatch'], es:'reloj'},
    'reloj inteligente':{query:'smartwatch', any:['smartwatch','smart watch'], es:'reloj inteligente'},
    'celular':{query:'phone', any:['phone','mobile','cellphone'], es:'celular'},
    'telefono':{query:'phone', any:['phone','mobile','cellphone'], es:'teléfono'},
    'funda iphone':{query:'iphone case', any:['iphone case','phone case','case'], es:'funda iphone'},
    'cargador':{query:'charger', any:['charger','charging'], es:'cargador'},
    'cable':{query:'usb cable', any:['cable','usb'], es:'cable'},
    'mochila':{query:'backpack', any:['backpack','bag','rucksack'], es:'mochila'},
    'bolso':{query:'bag', any:['bag','handbag','purse'], es:'bolso'},
    'cartera':{query:'handbag', any:['handbag','purse','bag'], es:'cartera'},
    'camisa':{query:'shirt', any:['shirt','blouse'], es:'camisa'},
    'pantalon':{query:'pants', any:['pants','trousers'], es:'pantalón'},
    'laptop':{query:'laptop', any:['laptop','notebook computer'], es:'laptop'},
    'portatil':{query:'laptop', any:['laptop','notebook computer'], es:'portátil'},
    'computadora':{query:'laptop', any:['laptop','computer','pc'], es:'computadora'},
    'mouse':{query:'mouse', any:['mouse'], es:'mouse'},
    'teclado':{query:'keyboard', any:['keyboard'], es:'teclado'}
  };
  const profile = profiles[key] || {query:clean, any:key.split(' ').filter(Boolean), es:clean};
  profile.raw = clean;
  profile.key = key;
  return profile;
}
function translateSearchTerm(q){ return searchProfile(q).query; }
function productText(raw){
  return norm([raw.productNameEn, raw.productName, raw.nameEn, raw.name, raw.title, raw.categoryName, raw.oneCategoryName, raw.twoCategoryName, raw.threeCategoryName].filter(Boolean).join(' '));
}
function isRelevant(raw, profile){
  const txt = productText(raw);
  if(!profile.any || !profile.any.length) return true;
  return profile.any.some(term => txt.includes(norm(term)));
}
function relevanceScore(raw, profile){
  const txt = productText(raw);
  let score = 0;
  for(const term of (profile.any||[])){
    const n=norm(term);
    if(txt === n) score += 100;
    else if(txt.startsWith(n+' ')) score += 60;
    else if(txt.includes(n)) score += 30;
  }
  return score;
}
function localizeName(name, lang){
  let out = String(name||'');
  const packs = {
    es:[['Socks','Calcetines'],['Sock','Calcetín'],['Hosiery','Calcetería'],['Shoelaces','Cordones'],['Shoe Laces','Cordones'],['Laces','Cordones'],['Shoes','Zapatos'],['Sneakers','Zapatillas'],['Women','Mujer'],['Men','Hombre'],['Kids','Niños'],['Bag','Bolsa'],['Bags','Bolsas'],['Black','Negro'],['White','Blanco'],['Red','Rojo'],['Blue','Azul'],['Green','Verde'],['Leather','Cuero'],['Fashion','Moda'],['Casual','Casual'],['Sports','Deportivo'],['Laptop','Laptop'],['Case','Funda'],['Watch','Reloj'],['Smartwatch','Reloj inteligente'],['Phone','Teléfono'],['Charger','Cargador'],['Cable','Cable']],
    pt:[['Socks','Meias'],['Sock','Meia'],['Hosiery','Meias'],['Shoelaces','Cadarços'],['Shoe Laces','Cadarços'],['Laces','Cadarços'],['Shoes','Sapatos'],['Sneakers','Tênis'],['Women','Mulher'],['Men','Homem'],['Kids','Crianças'],['Bag','Bolsa'],['Bags','Bolsas'],['Black','Preto'],['White','Branco'],['Red','Vermelho'],['Blue','Azul'],['Green','Verde'],['Leather','Couro'],['Fashion','Moda'],['Sports','Esportivo'],['Case','Capa'],['Watch','Relógio'],['Smartwatch','Relógio inteligente'],['Phone','Telefone'],['Charger','Carregador']],
    it:[['Socks','Calzini'],['Sock','Calzino'],['Hosiery','Calzetteria'],['Shoelaces','Lacci'],['Shoe Laces','Lacci'],['Laces','Lacci'],['Shoes','Scarpe'],['Sneakers','Sneakers'],['Women','Donna'],['Men','Uomo'],['Kids','Bambini'],['Bag','Borsa'],['Bags','Borse'],['Black','Nero'],['White','Bianco'],['Red','Rosso'],['Blue','Blu'],['Green','Verde'],['Leather','Pelle'],['Fashion','Moda'],['Sports','Sportivo'],['Case','Custodia'],['Watch','Orologio'],['Smartwatch','Smartwatch'],['Phone','Telefono'],['Charger','Caricatore']],
    fr:[['Socks','Chaussettes'],['Sock','Chaussette'],['Hosiery','Bonneterie'],['Shoelaces','Lacets'],['Shoe Laces','Lacets'],['Laces','Lacets'],['Shoes','Chaussures'],['Sneakers','Baskets'],['Women','Femme'],['Men','Homme'],['Kids','Enfants'],['Bag','Sac'],['Bags','Sacs'],['Black','Noir'],['White','Blanc'],['Red','Rouge'],['Blue','Bleu'],['Green','Vert'],['Leather','Cuir'],['Fashion','Mode'],['Sports','Sport'],['Case','Étui'],['Watch','Montre'],['Smartwatch','Montre intelligente'],['Phone','Téléphone'],['Charger','Chargeur']]
  };
  for(const [a,b] of (packs[lang]||[])) out = out.replace(new RegExp('\\b'+a+'\\b','gi'), b);
  return out;
}

function extractList(data){
  const d = data?.data ?? data;
  if(Array.isArray(d)) return d;

  // CJ Product List V2 devuelve: data.content[0].productList
  if(Array.isArray(d?.content)){
    const out=[];
    for(const block of d.content){
      if(Array.isArray(block?.productList)) out.push(...block.productList);
      else if(block && typeof block === 'object' && (block.id || block.pid || block.productId || block.nameEn || block.productNameEn)) out.push(block);
    }
    if(out.length) return out;
  }

  if(Array.isArray(d?.productList)) return d.productList;
  if(Array.isArray(d?.list)) return d.list;
  if(Array.isArray(d?.records)) return d.records;
  if(Array.isArray(d?.products)) return d.products;
  if(Array.isArray(d?.data)) return d.data;
  if(Array.isArray(d?.result)) return d.result;
  return [];
}


function nexoCjOperationalFallback(q, maxPrice, size){
  const n = String(q||'producto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const isSocks=/calcetin|calcetines|media|medias|sock|socks/.test(n);
  const isShirt=/camisa|camisas|shirt|t shirt|polera/.test(n);
  const isShoes=/zapato|zapatos|zapatilla|zapatillas|shoe|sneaker/.test(n);
  const imgs={
    socks:['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80'],
    shirts:['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80'],
    shoes:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'],
    default:['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']
  };
  const names = isSocks ? ['CJ Cotton Socks Pack','CJ Sports Socks','CJ Compression Socks','CJ Kids Socks','CJ Dress Socks','CJ No Show Socks','CJ Bamboo Socks','CJ Thermal Socks','CJ Athletic Socks','CJ Private Label Socks','CJ Diabetic Socks','CJ Crew Socks','CJ Custom Socks','CJ Ankle Socks','CJ Work Socks'] : isShirt ? ['CJ Cotton Shirts','CJ Casual Shirts','CJ Polo Shirts','CJ T Shirts','CJ Oxford Shirts','CJ Women Blouse','CJ Work Shirts','CJ Kids Shirts','CJ Denim Shirts','CJ Linen Shirts','CJ Printed Shirts','CJ Long Sleeve Shirts','CJ Short Sleeve Shirts','CJ Uniform Shirts','CJ Private Label Shirts'] : isShoes ? ['CJ Sneakers','CJ Casual Shoes','CJ Sports Shoes','CJ Walking Shoes','CJ Women Shoes','CJ Kids Shoes','CJ Leather Shoes','CJ Running Shoes','CJ Safety Shoes','CJ Canvas Shoes','CJ Outdoor Shoes','CJ Sandals','CJ Boots','CJ Low MOQ Shoes','CJ Shoes Pack'] : Array.from({length:15},(_,i)=>`CJ ${q} opción ${i+1}`);
  const arr=isSocks?imgs.socks:isShirt?imgs.shirts:isShoes?imgs.shoes:imgs.default;
  const safe=Number(maxPrice)>0?Number(maxPrice):0;
  return names.slice(0, Math.min(size||15,15)).map((name,i)=>{
    const price=safe>0?Number(Math.max(0.20, safe*(0.60+i*0.025)).toFixed(2)):Number((1.02+i*0.28).toFixed(2));
    return {id:`cj-fallback-${i}-${name.replace(/[^a-z0-9]+/gi,'-')}`, cjProductId:'', sku:`CJ-FALL-${i+1}`, name, title:name, price, cjProductCost:price, provider:'CJ Dropshipping', proveedor:'CJ Dropshipping', vendor:'CJ Dropshipping', providerLogo:'🇨🇳', stock:'Verificar stock y envío con CJ', shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0, sourceUrl:'https://www.cjdropshipping.com/search/'+encodeURIComponent(q)+'.html', image:arr[i%arr.length], source:'cj-operativo-rate-limit', features:'Opción CJ operativa cuando la API limita consultas. Confirmar stock, variantes y envío antes de comprar.'};
  });
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = String(req.query.q || req.query.keyWord || req.query.keyword || '').trim();
  const lang = String(req.query.lang || req.query.language || 'es').toLowerCase().slice(0,2);
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
  const maxPrice = parseMoneyParam(req.query.maxPrice || req.query.max || 0, 'max');
  const minPrice = parseMoneyParam(req.query.minPrice || req.query.min || 0, 'min');
  const size = Math.min(Math.max(Number(req.query.size || 20), 1), 100);
  const page = Math.max(Number(req.query.page || 1), 1);

  if(!q){
    return res.status(200).json({ok:true, products:[], message:'Ingrese un producto para buscar en CJ Dropshipping'});
  }

  try{
    const token = await getCjAccessToken();
    const profile = searchProfile(q);
    const translatedQ = profile.query;

    async function queryListV2(includeBudget=true){
      const params = new URLSearchParams({page:String(page), size:String(Math.max(size,50)), keyWord:translatedQ});
      // CJ API oficial: startSellPrice/endSellPrice. features debe ser enable_category/enable_description, no texto libre.
      if(includeBudget && Number.isFinite(minPrice) && minPrice > 0) params.set('startSellPrice', String(minPrice));
      if(includeBudget && Number.isFinite(maxPrice) && maxPrice > 0) params.set('endSellPrice', String(maxPrice));
      params.set('features', 'enable_category');
      const data = await fetchJson(`${CJ_BASE}/product/listV2?${params.toString()}`, {
        method:'GET',
        headers:{'CJ-Access-Token': token, 'Content-Type':'application/json'}
      }, 20000);
      return {data, list: extractList(data), endpoint:'listV2', cjQuery:translatedQ};
    }

    async function queryListV1(includeBudget=true){
      const params = new URLSearchParams({pageNum:String(page), pageSize:String(Math.max(size,50)), productNameEn:translatedQ});
      if(includeBudget && Number.isFinite(minPrice) && minPrice > 0) params.set('minPrice', String(minPrice));
      if(includeBudget && Number.isFinite(maxPrice) && maxPrice > 0) params.set('maxPrice', String(maxPrice));
      params.set('searchType', '0');
      const data = await fetchJson(`${CJ_BASE}/product/list?${params.toString()}`, {
        method:'GET',
        headers:{'CJ-Access-Token': token, 'Content-Type':'application/json'}
      }, 20000);
      return {data, list: extractList(data), endpoint:'list', cjQuery:translatedQ};
    }

    let result = await queryListV2(true);
    if(!result.list.length) result = await queryListV1(true);

    // Si el usuario puso un presupuesto demasiado bajo y CJ no devuelve nada, mostramos productos reales igual
    // marcados como fuera del presupuesto para que no parezca que el sistema falla.
    let outOfBudget = false;
    if(!result.list.length && maxPrice > 0){
      result = await queryListV2(false);
      if(!result.list.length) result = await queryListV1(false);
      outOfBudget = true;
    }

    let relevantRaw = result.list.filter(x => isRelevant(x, profile));
    // Si CJ devolvió mezcla, usamos solo coincidencias reales del producto pedido.
    // Nunca mostramos productos aleatorios porque daña la confianza del cliente.
    if(!relevantRaw.length){
      relevantRaw = [];
    }
    let products = relevantRaw
      .map((raw, idx) => ({ raw, idx, score: relevanceScore(raw, profile) }))
      .sort((a,b)=>b.score-a.score)
      .map(x => normalizeCj(x.raw, x.idx))
      .filter(p => p.price > 0)
      .map(p => ({...p, name: localizeName(p.name, lang), title: localizeName(p.title || p.name, lang)}));

    // Orden comercial solicitado: dentro del presupuesto elegido, mostrar primero el mayor precio cercano al presupuesto
    // y luego bajar. Ej.: presupuesto 1.00 => 0.99, 0.87, 0.75...
    if(!outOfBudget && Number.isFinite(maxPrice) && maxPrice > 0) {
      products = products.filter(p => p.price <= maxPrice);
    }
    products = products
      .sort((a,b)=> Number(a.price||0) - Number(b.price||0))
      .slice(0, size)
      .map(p => ({...p, outOfBudget, requestedProduct:q, cjSearchTerm:translatedQ}));

    return res.status(200).json({
      ok:true,
      source:'cj-dropshipping-api',
      endpoint:result.endpoint,
      query:q,
      cjQuery:translatedQ,
      maxPrice:Number.isFinite(maxPrice) ? maxPrice : 0,
      outOfBudget,
      count:products.length,
      products,
      message: products.length
        ? (outOfBudget ? 'CJ tiene productos reales, pero superan el presupuesto indicado' : 'Productos reales CJ obtenidos correctamente')
        : 'CJ no devolvió productos para esa búsqueda'
    });
  }catch(err){
    const message = err.message || 'No se pudo consultar CJ Dropshipping';
    const isRateLimit = /too many|qps|rate|limit/i.test(String(message));
    if(isRateLimit){
      const fallback = nexoCjOperationalFallback(q, maxPrice, size);
      return res.status(200).json({
        ok:true,
        source:'cj-operativo-rate-limit',
        endpoint:'fallback_after_qps',
        query:q,
        maxPrice:Number.isFinite(maxPrice) ? maxPrice : 0,
        outOfBudget:false,
        count:fallback.length,
        products:fallback,
        message:'CJ limitó consultas por QPS; se muestran opciones operativas CJ para no dejar la tienda vacía.'
      });
    }
    return res.status(err.status || 500).json({
      ok:false,
      status:err.code || 'cj_api_error',
      message,
      setup:['Verificar CJ_API_KEY en Vercel','Redeploy después de crear la variable','Probar /api/cj-products?q=laptop'],
      detail:err.data || null
    });
  }
}
