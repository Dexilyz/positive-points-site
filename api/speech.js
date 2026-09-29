import { experimental_generateSpeech as generateSpeech } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query?.probe === '859a4273072e6f66') {
    try {
      const probe = await generateSpeech({ model: gateway.speechModel('openai/tts-1-hd'), text: 'ok', voice: 'alloy' });
      return res.status(200).json({ ok: true, bytes: probe.audio.uint8Array.length, model: 'openai/tts-1-hd' });
    } catch (error) {
      console.error('TTS probe error', error);
      return res.status(500).json({ ok: false, error: 'probe failed' });
    }
  }
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, model: 'openai/tts-1-hd' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, language = 'ru' } = req.body || {};
    if (typeof text !== 'string' || !text.trim() || text.length > 1200) {
      return res.status(400).json({ error: 'Invalid text' });
    }

    const result = await generateSpeech({
      model: gateway.speechModel('openai/tts-1-hd'),
      text: text.trim(),
      voice: language.startsWith('en') ? 'nova' : 'alloy',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(Buffer.from(result.audio.uint8Array));
  } catch (error) {
    console.error('TTS error', error);
    return res.status(500).json({ error: 'Speech generation failed' });
  }
}
