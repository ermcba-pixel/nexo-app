// nexo™ – Estado de integración Alibaba
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({
    ok:true,
    provider:'Alibaba',
    appKeyConfigured:Boolean(process.env.ALIBABA_APP_KEY),
    appSecretConfigured:Boolean(process.env.ALIBABA_APP_SECRET),
    callbackConfigured:Boolean(process.env.ALIBABA_CALLBACK_URL),
    appKeySuffix:String(process.env.ALIBABA_APP_KEY||'').slice(-3),
    oauth:'OAuth 2.0 Server-side',
    appStatus:'Test / SystemAPI Active',
    agent:'agente1',
    readyForNexo:true
  });
}
