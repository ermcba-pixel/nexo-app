// nexo – Amazon Product Search API REAL ONLY
// No devuelve catálogo falso. Usa PA-API si las variables existen.
// Acepta alias de variables para no romper Vercel: AMAZON_ACCESS_KEY o AMAZON_CLIENT_ID, AMAZON_SECRET_KEY o AMAZON_CLIENT_SECRET.

import crypto from 'crypto';

const REGION = process.env.AMAZON_REGION || 'us-east-1';
const HOST = process.env.AMAZON_HOST || 'webservices.amazon.com';
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || process.env.AMAZON_PARTNER_TAG || process.env.AMAZON_TAG || 'nexo20-8';
const PARTNER_TYPE = process.env.AMAZON_PARTNER_TYPE || 'Associates';
const SERVICE = 'ProductAdvertisingAPI';
const PATH = '/paapi5/searchitems';
const TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
}
function accessKey(){return process.env.AMAZON_ACCESS_KEY || process.env.AMAZON_ACCESS_KEY_ID || process.env.AMAZON_CLIENT_ID || '';}
function secretKey(){return process.env.AMAZON_SECRET_KEY || process.env.AMAZON_SECRET_ACCESS_KEY || process.env.AMAZON_CLIENT_SECRET || '';}
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
function signHeaders(payload){
  const ak=accessKey(); const sk=secretKey();
  if(!ak || !sk || !PARTNER_TAG) throw new Error('missing_paapi_env');
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
  const signature=hmac(signingKey(sk, short, REGION, SERVICE), stringToSign, 'hex');
  return {...headers, authorization:`AWS4-HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`};
}
function withTag(url, q='producto'){
  try{
    const u = new URL(String(url||'').startsWith('http') ? String(url) : `https://${MARKETPLACE}/s?k=${encodeURIComponent(q)}`);
    u.searchParams.set('tag', PARTNER_TAG);
    return u.toString();
  }catch(e){ return `https://${MARKETPLACE}/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(PARTNER_TAG)}`; }
}
function parseMax(v){const nums=String(v??'').match(/[0-9]+(?:\.[0-9]+)?/g)||[]; const arr=nums.map(Number).filter(Number.isFinite); return arr.length?Math.max(...arr):0;}
function normalize(item, idx, q){
  const listing=item?.Offers?.Listings?.[0] || {};
  const price=Number(listing?.Price?.Amount || item?.Offers?.Summaries?.[0]?.LowestPrice?.Amount || 0);
  const image=item?.Images?.Primary?.Large?.URL || item?.Images?.Primary?.Medium?.URL || item?.Images?.Primary?.Small?.URL || '';
  const title=item?.ItemInfo?.Title?.DisplayValue || '';
  const asin=item?.ASIN || `AMZ-${idx+1}`;
  const url=withTag(item?.DetailPageURL || `https://${MARKETPLACE}/dp/${asin}`, q);
  return {
    id:`amazon-${asin}`, asin, name:title, title, provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🇺🇸',
    price:Number(price.toFixed(2)), shippingAmazon:null, vendorFee:null, cjShippingCost:0, cjHandlingFee:0,
    category:'Amazon', image, url, sourceUrl:url, originalProviderUrl:url,
    stock:listing?.Availability?.Message || 'Verificar disponibilidad y precio final en Amazon',
    source:'amazon-paapi', rating:4.7, reviews:item?.CustomerReviews?.Count || 0,
    features:'Producto real de Amazon PA-API. Confirmar precio final, disponibilidad y envío en Amazon antes de comprar.',
    originalAmazon:true
  };
}
async function searchPaapi(q, maxPrice){
  const ak=accessKey(); const sk=secretKey();
  if(!ak || !sk || !PARTNER_TAG) return {ok:false, reason:'missing_paapi_env', expected:['AMAZON_ACCESS_KEY o AMAZON_CLIENT_ID','AMAZON_SECRET_KEY o AMAZON_CLIENT_SECRET','AMAZON_ASSOCIATE_TAG o AMAZON_PARTNER_TAG'], seen:{AMAZON_CLIENT_ID:Boolean(process.env.AMAZON_CLIENT_ID), AMAZON_CLIENT_SECRET:Boolean(process.env.AMAZON_CLIENT_SECRET), AMAZON_REFRESH_TOKEN:Boolean(process.env.AMAZON_REFRESH_TOKEN), AMAZON_ASSOCIATE_TAG:Boolean(process.env.AMAZON_ASSOCIATE_TAG)}};
  const payload=JSON.stringify({
    Keywords:q || 'product', SearchIndex:'All', ItemCount:10, PartnerTag:PARTNER_TAG, PartnerType:PARTNER_TYPE, Marketplace:MARKETPLACE,
    Resources:['Images.Primary.Small','Images.Primary.Medium','Images.Primary.Large','ItemInfo.Title','Offers.Listings.Price','Offers.Listings.Availability.Message','Offers.Summaries.LowestPrice']
  });
  const r=await fetch(`https://${HOST}${PATH}`, {method:'POST', headers:signHeaders(payload), body:payload});
  const text=await r.text();
  if(!r.ok) return {ok:false, reason:'paapi_rejected', status:r.status, detail:text.slice(0,1200)};
  const data=JSON.parse(text);
  let products=(data?.SearchResult?.Items||[]).map((it,i)=>normalize(it,i,q)).filter(p=>p.price>0 && p.image && p.name);
  if(maxPrice>0) products=products.filter(p=>p.price<=maxPrice);
  products=products.sort((a,b)=>a.price-b.price).slice(0,15);
  return {ok:true, products};
}

export default async function handler(req,res){
  cors(res); if(req.method==='OPTIONS') return res.status(200).end(); if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.search||'').trim(); const maxPrice=parseMax(req.query.maxPrice||req.query.max||0);
  try{
    const real=await searchPaapi(q,maxPrice);
    if(real.ok && real.products.length) return res.status(200).json({ok:true, provider:'Amazon', mode:'production_paapi_real_only', count:real.products.length, products:real.products, amazonSearchUrl:withTag(`https://${MARKETPLACE}/s?k=${encodeURIComponent(q||'producto')}`,q)});
    return res.status(200).json({ok:false, provider:'Amazon', mode:'paapi_sin_resultados_reales', message:'Amazon no devolvió productos reales por PA-API. No se muestran productos falsos ni fotos de prueba.', amazonSearchUrl:withTag(`https://${MARKETPLACE}/s?k=${encodeURIComponent(q||'producto')}`,q), paapiStatus:real, products:[]});
  }catch(e){
    return res.status(200).json({ok:false, provider:'Amazon', mode:'paapi_error', message:'Amazon no devolvió productos reales por PA-API. No se muestran productos falsos ni fotos de prueba.', amazonSearchUrl:withTag(`https://${MARKETPLACE}/s?k=${encodeURIComponent(q||'producto')}`,q), error:String(e.message||e), products:[]});
  }
}
