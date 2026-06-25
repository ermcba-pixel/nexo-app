// nexo™ – Estado de integración Alibaba
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({
    ok:true,
    provider:'Alibaba',
    appKeyConfigured:Boolean(process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY),
    appSecretConfigured:Boolean(process.env.ALIBABA_APP_SECRET || process.env.ALIBABA_APPSECRET),
    redirectConfigured:Boolean(process.env.ALIBABA_REDIRECT_URI || process.env.ALIBABA_CALLBACK_URL),
    callbackUrl:process.env.ALIBABA_REDIRECT_URI || process.env.ALIBABA_CALLBACK_URL || 'https://nexoservicios.online/api/alibaba/callback',
    accessTokenConfigured:Boolean(process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN),
    appKeySuffix:String(process.env.ALIBABA_APP_KEY||process.env.ALIBABA_APPKEY||'').slice(-3),
    oauth:'OAuth 2.0 Server-side / Buyer ISV',
    endpoints:{auth:'/api/alibaba/auth',callback:'/api/alibaba/callback',products:'/api/alibaba/products'},
    readyForNexo:Boolean((process.env.ALIBABA_APP_KEY||process.env.ALIBABA_APPKEY) && (process.env.ALIBABA_APP_SECRET||process.env.ALIBABA_APPSECRET) && (process.env.ALIBABA_ACCESS_TOKEN||process.env.ALIBABA_TOKEN))
  });
}
