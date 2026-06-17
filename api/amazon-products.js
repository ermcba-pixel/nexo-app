// nexo – Amazon Product Search API
// Producción: cuando Amazon habilite Creators API/PA-API, usa AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY y AMAZON_ASSOCIATE_TAG.
// Operación actual: si Amazon todavía no habilita catálogo oficial, devuelve catálogo temporal profesional para que el flujo llegue hasta PayPal.

import crypto from 'crypto';

const REGION = process.env.AMAZON_REGION || 'us-east-1';
const HOST = process.env.AMAZON_HOST || 'webservices.amazon.com';
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
const NEXO_AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';
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
  products=products.sort((a,b)=>Number(b.price)-Number(a.price));
  return {ok:true, products};
}

const catalog = {
  iphone: [
    ['Apple iPhone 15 Pro Max 256GB',1199,'phone'],['Apple iPhone 15 Pro 128GB',999,'phone'],['Apple iPhone 15 Plus 128GB',899,'phone'],['Apple iPhone 15 128GB',799,'phone'],['Apple iPhone 14 Pro Max 256GB',749,'phone'],['Apple iPhone 14 Pro 128GB',699,'phone'],['Apple iPhone 14 128GB',599,'phone'],['Apple iPhone 13 128GB',449,'phone'],['Apple iPhone SE 3rd Gen',289,'phone'],['Apple MagSafe Charger',39,'phone'],['Apple USB-C Power Adapter',29,'phone'],['iPhone 15 Silicone Case',24,'phone']
  ],
  laptop: [
    ['Apple MacBook Pro 14 M3',1799,'laptop'],['Dell XPS 15 Laptop',1499,'laptop'],['Lenovo ThinkPad X1 Carbon',1399,'laptop'],['HP Spectre x360 14',1199,'laptop'],['Microsoft Surface Laptop 5',999,'laptop'],['Acer Aspire 5 15.6',529,'laptop'],['Lenovo IdeaPad 15',399,'laptop'],['HP 14 Ryzen Laptop',349,'laptop']
  ],
  default: [
    ['Amazon Echo Show 10',249,'product'],['Kindle Paperwhite Signature',189,'product'],['Fire HD 10 Tablet',139,'product'],['Ring Video Doorbell',99,'product'],['Anker USB-C Hub',59,'product'],['Logitech Wireless Mouse',34,'product'],['USB-C Cable 2 Pack',19,'product'],['Phone Stand Aluminum',15,'product']
  ]
};
function temporaryCatalog(q, maxPrice){
  const key = /iphone|ios|apple phone/i.test(q) ? 'iphone' : /laptop|notebook|macbook|comput/i.test(q) ? 'laptop' : 'default';
  let rows = catalog[key].concat(catalog.default).slice(0,20);
  let products = rows.map((r,idx)=>{
    const [name, price, imageType] = r;
    const query = encodeURIComponent(name);
    return {
      id:`amazon-temp-${key}-${idx+1}`, asin:null, name, title:name, provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🟠',
      price:Number(price), shippingAmazon:0, vendorFee:0, shippingQuoteStatus:'pending_amazon_checkout', category:'electronica',
      image:'', imageType, url:withNexoAmazonTag(`https://${MARKETPLACE}/s?k=${query}`), sourceUrl:withNexoAmazonTag(`https://${MARKETPLACE}/s?k=${query}`),
      stock:'Verificar en Amazon', source:'amazon-temporal-catalog', rating:4.6, reviews:0,
      sandbox:false, originalAmazon:false, temporalUntilCreatorsApi:true
    };
  });
  if(maxPrice) products = products.filter(p=>p.price<=maxPrice);
  return products.sort((a,b)=>Number(b.price)-Number(a.price));
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
      return res.status(200).json({ok:true, provider:'Amazon', mode:'production_paapi', originalImages:true, sort:'price_desc', products:real.products});
    }
    return res.status(200).json({
      ok:true,
      provider:'Amazon',
      mode:'temporary_catalog_until_creators_api',
      originalImages:false,
      sort:'price_desc',
      notice:'Catálogo temporal activo: Amazon Associates/Creators API aún no habilitó credenciales de catálogo. Los enlaces abren Amazon con el tag afiliado nexo08-20.',
      paapiStatus:real,
      products:temporaryCatalog(q, maxPrice)
    });
  }catch(e){
    return res.status(200).json({
      ok:true,
      provider:'Amazon',
      mode:'temporary_catalog_until_creators_api',
      originalImages:false,
      sort:'price_desc',
      notice:'Catálogo temporal activo mientras Amazon habilita Creators API.',
      error:String(e.message||e),
      products:temporaryCatalog(q, maxPrice)
    });
  }
}
