// nexo™ – Estado de integración Alibaba
function pick(...names){ for(const n of names){ if(process.env[n]) return process.env[n]; } return ''; }
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const appKey=pick('ALIBABA_APP_KEY','ALIBABA_APPKEY','ALIBABA_CLIENT_ID','ALIBABA_APP_ID');
  const appSecret=pick('ALIBABA_APP_SECRET','ALIBABA_APPSECRET','ALIBABA_CLIENT_SECRET','ALIBABA_SECRET_KEY');
  const token=pick('ALIBABA_ACCESS_TOKEN','ALIBABA_TOKEN','ALIBABA_SESSION','ALIBABA_SESSION_KEY');
  return res.status(200).json({
    ok:Boolean(appKey&&appSecret&&token),
    provider:'Alibaba',
    appKeyConfigured:Boolean(appKey),
    appSecretConfigured:Boolean(appSecret),
    accessTokenConfigured:Boolean(token),
    callbackConfigured:Boolean(process.env.ALIBABA_CALLBACK_URL),
    appKeySuffix:String(appKey||'').slice(-3),
    oauth:'OAuth 2.0 Server-side',
    officialApis:['alibaba.icbu.product.list','alibaba.icbu.product.get'],
    readyForNexo:Boolean(appKey&&appSecret&&token)
  });
}
