function splitText(text, max = 180) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return [clean];
  const out = []; let rest = clean;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.55) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

async function googleTts(text, language) {
  const lang = String(language || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';
  const parts = [];
  for (const chunk of splitText(text)) {
    const url = new URL('https://translate.google.com/translate_tts');
    url.searchParams.set('ie','UTF-8'); url.searchParams.set('client','tw-ob');
    url.searchParams.set('tl',lang); url.searchParams.set('q',chunk);
    const response = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'audio/mpeg,*/*;q=0.8'}});
    if(!response.ok) throw new Error('TTS upstream '+response.status);
    parts.push(Buffer.from(await response.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

export default async function handler(req,res){
  if(req.method==='GET') return res.status(200).json({ok:true,provider:'temporary-google-tts'});
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'});}
  try{
    const {text,language='ru'}=req.body||{};
    if(typeof text!=='string'||!text.trim()||text.length>1800)return res.status(400).json({error:'Invalid text'});
    const audio=await googleTts(text.trim(),language);
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(audio);
  }catch(error){
    console.error('TTS error',error);return res.status(502).json({error:'Speech generation failed'});
  }
}
