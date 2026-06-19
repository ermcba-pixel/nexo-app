// nexo – Amazon Product Search API
// Producción: cuando Amazon habilite Creators API/PA-API, usa AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY y AMAZON_ASSOCIATE_TAG.
// Operación actual: si Amazon todavía no habilita catálogo oficial, devuelve catálogo temporal profesional para que el flujo llegue hasta PayPal.

import crypto from 'crypto';

const REGION = process.env.AMAZON_REGION || 'us-east-1';
const HOST = process.env.AMAZON_HOST || 'webservices.amazon.com';
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
const NEXO_AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'nexo20-8';
function withNexoAmazonTag(url){
  try{
    const u = new URL(String(url || '').startsWith('http') ? String(url) : `https://${MARKETPLACE}/s?k=producto`);
    u.searchParams.set('tag', NEXO_AMAZON_TAG);
    return u.toString();
  }catch(e){ return `https://${MARKETPLACE}/s?k=producto&tag=${encodeURIComponent(NEXO_AMAZON_TAG)}`; }
}
const SERVICE = 'ProductAdvertisingAPI';
const PATH = '/paapi5/searchitems';
const TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

function hmac(key, data, enc){ return crypto.createHmac('sha256', key).update(data, 'utf8').digest(enc); }
function sha256(data, enc='hex'){ return crypto.createHash('sha256').update(data, 'utf8').digest(enc); }
function amzDate(d=new Date()){
  const iso=d.toISOString().replace(/[:-]|\.\d{3}/g,'');
  return {amz: iso, short: iso.slice(0,8)};
}
function signingKey(secret, dateStamp, regionName, serviceName){
  const kDate=hmac('AWS4'+secret, dateStamp);
  const kRegion=hmac(kDate, regionName);
  const kService=hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}
function signHeaders({payload}){
  const accessKey=process.env.AMAZON_ACCESS_KEY;
  const secretKey=process.env.AMAZON_SECRET_KEY;
  if(!accessKey || !secretKey) throw new Error('missing_paapi_keys');
  const {amz, short}=amzDate();
  const headers={
    'content-encoding':'amz-1.0',
    'content-type':'application/json; charset=utf-8',
    'host':HOST,
    'x-amz-date':amz,
    'x-amz-target':TARGET
  };
  const signedHeaders=Object.keys(headers).sort().join(';');
  const canonicalHeaders=Object.keys(headers).sort().map(k=>`${k}:${headers[k]}\n`).join('');
  const canonicalRequest=['POST', PATH, '', canonicalHeaders, signedHeaders, sha256(payload)].join('\n');
  const credentialScope=`${short}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign=['AWS4-HMAC-SHA256', amz, credentialScope, sha256(canonicalRequest)].join('\n');
  const signature=hmac(signingKey(secretKey, short, REGION, SERVICE), stringToSign, 'hex');
  return {...headers,'authorization':`AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`};
}
function normalizePaapiItem(item, idx){
  const listing=item?.Offers?.Listings?.[0] || {};
  const price=Number(listing?.Price?.Amount || item?.Offers?.Summaries?.[0]?.LowestPrice?.Amount || 0);
  const image=item?.Images?.Primary?.Large?.URL || item?.Images?.Primary?.Medium?.URL || item?.Images?.Primary?.Small?.URL || '';
  const title=item?.ItemInfo?.Title?.DisplayValue || 'Producto Amazon';
  const asin=item?.ASIN || `AMZ-${idx+1}`;
  const url=withNexoAmazonTag(item?.DetailPageURL || `https://${MARKETPLACE}/dp/${asin}`);
  const availability=listing?.Availability?.Message || '';
  return {
    id:`amazon-${asin}`, asin, name:title, title, provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🟠',
    price, shippingAmazon:null, vendorFee:null, shippingQuoteStatus:'pending_amazon_checkout',
    category:/laptop|notebook|iphone|phone|tablet|monitor|pc|computer|usb|cable/i.test(title) ? 'electronica' : 'general',
    image, imageType:/laptop|notebook|macbook/i.test(title) ? 'laptop' : /iphone|phone|cell/i.test(title) ? 'phone' : 'product',
    url, sourceUrl:url, stock: availability || 'Amazon', source:'amazon-paapi', rating:4.7, reviews:item?.CustomerReviews?.Count || 0,
    sandbox:false, originalAmazon:true
  };
}
async function searchAmazonPaapi(q, maxPrice){
  const partnerTag=process.env.AMAZON_ASSOCIATE_TAG;
  if(!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY || !partnerTag){
    return {ok:false, reason:'missing_paapi_env'};
  }
  const payload=JSON.stringify({
    Keywords:q || 'laptop', SearchIndex:'All', ItemCount:10, PartnerTag:partnerTag, PartnerType:'Associates', Marketplace:MARKETPLACE,
    Resources:['Images.Primary.Small','Images.Primary.Medium','Images.Primary.Large','ItemInfo.Title','Offers.Listings.Price','Offers.Listings.Availability.Message','Offers.Summaries.LowestPrice','CustomerReviews.Count']
  });
  const r=await fetch(`https://${HOST}${PATH}`, {method:'POST', headers:signHeaders({payload}), body:payload});
  const text=await r.text();
  if(!r.ok) return {ok:false, reason:'paapi_rejected', status:r.status, detail:text.slice(0,500)};
  const data=JSON.parse(text);
  let products=(data?.SearchResult?.Items || []).map(normalizePaapiItem).filter(p=>p.price>0);
  if(maxPrice) products=products.filter(p=>p.price<=maxPrice);
  products=products.sort((a,b)=>Number(a.price)-Number(b.price));
  return {ok:true, products};
}

const catalog = {
  socks: [
    ['Men Athletic Socks 6 Pack',14.99,'socks'],['Cotton Crew Socks 10 Pack',12.99,'socks'],['Compression Socks 3 Pack',18.99,'socks'],['Dress Socks for Men 6 Pairs',16.99,'socks'],['Women Ankle Socks 8 Pack',11.99,'socks'],['Kids Colorful Socks 12 Pack',13.49,'socks'],['Sports Cushioned Socks 6 Pack',15.99,'socks'],['No Show Socks 10 Pack',10.99,'socks'],['Thermal Winter Socks 4 Pack',19.99,'socks'],['Bamboo Socks 6 Pairs',17.50,'socks'],['Running Socks 5 Pack',13.75,'socks'],['Novelty Socks Gift Set',9.99,'socks']
  ],
  shoelaces: [
    ['Flat Shoelaces 6 Pairs',7.99,'shoelaces'],['Elastic No Tie Shoelaces',8.99,'shoelaces'],['Round Boot Laces 3 Pairs',9.99,'shoelaces'],['Reflective Shoelaces 4 Pairs',6.99,'shoelaces'],['Sneaker Replacement Laces',5.99,'shoelaces']
  ],
  shoes: [
    ['Running Sneakers Men',24.99,'shoes'],['Women Walking Sneakers',22.99,'shoes'],['Kids Athletic Shoes',19.99,'shoes'],['Casual Canvas Sneakers',18.99,'shoes'],['Training Shoes Lightweight',27.99,'shoes'],['Sports Shoes Breathable',21.99,'shoes'],['Slip On Sneakers',20.99,'shoes'],['Outdoor Walking Shoes',29.99,'shoes']
  ],
  iphone: [
    ['Apple USB-C Power Adapter',19.99,'phone'],['iPhone 15 Silicone Case',24.00,'phone'],['MagSafe Compatible Charger',23.99,'phone'],['USB-C Cable 2 Pack',12.99,'phone'],['Phone Stand Aluminum',15.00,'phone'],['Screen Protector 3 Pack',9.99,'phone']
  ],
  laptop: [
    ['USB-C Hub 6 in 1',22.99,'laptop'],['Laptop Stand Aluminum',24.99,'laptop'],['Wireless Mouse',14.99,'laptop'],['HDMI Cable 2 Pack',11.99,'laptop'],['Keyboard Cover',9.99,'laptop']
  ],
  default: [
    ['USB-C Cable 2 Pack',12.99,'product'],['Phone Stand Aluminum',15.00,'product'],['Logitech Wireless Mouse',24.99,'product'],['Anker USB-C Hub',23.99,'product'],['Travel Organizer Bag',18.99,'product'],['Desk Accessories Set',19.99,'product']
  ]
};
function catalogKey(q){
  if(/calcetin|calcetines|media|medias|sock/i.test(q)) return 'socks';
  if(/cordon|cordones|shoelace|lace/i.test(q)) return 'shoelaces';
  if(/zapatilla|zapatillas|zapato|zapatos|sneaker|sneakers|shoe|shoes|tenis/i.test(q)) return 'shoes';
  if(/iphone|ios|apple phone|celular|telefono|phone/i.test(q)) return 'iphone';
  if(/laptop|notebook|macbook|comput/i.test(q)) return 'laptop';
  return 'default';
}
function temporaryCatalog(q, maxPrice){
  const key = catalogKey(q || '');
  let rows = (catalog[key] || catalog.default).slice();
  if(key === 'default') rows = rows.concat(catalog.socks.slice(0,4), catalog.shoelaces.slice(0,3));
  const limit = Number(maxPrice || 0);
  const imageByType = {
    socks:'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80',
    shoelaces:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    shoes:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    phone:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    laptop:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    product:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
  };
  let products = rows.map((r,idx)=>{
    const [name, price, imageType] = r;
    const query = encodeURIComponent(name);
    const url = withNexoAmazonTag(`https://${MARKETPLACE}/s?k=${query}`);
    return {
      id:`amazon-temp-${key}-${idx+1}`, asin:null, name, title:name, provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🇺🇸',
      price:Number(price), shippingAmazon:0, vendorFee:0, shippingQuoteStatus:'pending_amazon_checkout', category:key,
      image:imageByType[imageType] || imageByType.product, imageType, url, sourceUrl:url, originalProviderUrl:url,
      stock:'Verificar disponibilidad y precio final en Amazon', source:'amazon-affiliate-link', rating:4.6, reviews:0,
      sandbox:false, originalAmazon:false, temporalUntilCreatorsApi:true, amazonAffiliate:true, amazon_tag:NEXO_AMAZON_TAG,
      features:'Opción de Amazon con enlace afiliado nexo20-8. Verificar precio final, disponibilidad y envío en Amazon antes de comprar.'
    };
  });
  if(limit > 0) products = products.filter(p=>Number(p.price||0) <= limit);
  return products.sort((a,b)=>Number(a.price)-Number(b.price)).slice(0,50);
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q || req.query.search || '').trim();
  const maxPrice=Number(req.query.maxPrice || req.query.max || 0);
  try{
    const real=await searchAmazonPaapi(q, maxPrice);
    if(real.ok && real.products?.length){
      return res.status(200).json({ok:true, provider:'Amazon', mode:'production_paapi', originalImages:true, sort:'price_asc', products:real.products});
    }
    return res.status(200).json({
      ok:true,
      provider:'Amazon',
      mode:'temporary_catalog_until_creators_api',
      originalImages:false,
      sort:'price_asc',
      notice:'Amazon PA-API no devolvió catálogo real. Se muestran opciones con enlace afiliado nexo20-8, sin imágenes de reloj genéricas.',
      paapiStatus:real,
      products:temporaryCatalog(q, maxPrice)
    });
  }catch(e){
    return res.status(200).json({
      ok:true,
      provider:'Amazon',
      mode:'temporary_catalog_until_creators_api',
      originalImages:false,
      sort:'price_asc',
      notice:'Amazon PA-API no devolvió catálogo real; se mantiene enlace afiliado nexo20-8.',
      error:String(e.message||e),
      products:temporaryCatalog(q, maxPrice)
    });
  }
}
