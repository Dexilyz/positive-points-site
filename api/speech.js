import { EdgeTTS } from '@travisvn/edge-tts';

function voiceFor(language, profile) {
  if (String(language || '').toLowerCase().startsWith('en')) return 'en-US-AndrewMultilingualNeural';
  if (profile === 'papa') return 'ru-RU-DmitryNeural';
  return 'ru-RU-SvetlanaNeural';
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query?.probe === 'voicecheck') {
    try {
      const tts = new EdgeTTS('Проверка голоса', 'ru-RU-DmitryNeural');
      const result = await tts.synthesize();
      const audio = Buffer.from(await result.audio.arrayBuffer());
      return res.status(200).json({ ok: true, bytes: audio.length, provider: 'microsoft-neural' });
    } catch (error) {
      console.error('Neural TTS probe error', error);
      return res.status(500).json({ ok: false, error: 'probe failed' });
    }
  }
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      provider: 'microsoft-neural',
      voices: ['ru-RU-DmitryNeural','ru-RU-SvetlanaNeural','en-US-AndrewMultilingualNeural']
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, language = 'ru', profile = 'elisey' } = req.body || {};
    if (typeof text !== 'string' || !text.trim() || text.length > 1800) {
      return res.status(400).json({ error: 'Invalid text' });
    }

    const voice = voiceFor(language, profile);
    const tts = new EdgeTTS(text.trim(), voice);
    const result = await tts.synthesize();
    const audio = Buffer.from(await result.audio.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('X-Utro-Voice', voice);
    return res.status(200).send(audio);
  } catch (error) {
    console.error('Neural TTS error', error);
    return res.status(502).json({ error: 'Speech generation failed' });
  }
}
