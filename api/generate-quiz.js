const MODEL = 'gemini-3.8-flash';

function cleanList(value, max) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(-max) : [];
}

function normalizeQuestion(q, index) {
  const kind = String(q.kind || 'choices');
  const options = Array.isArray(q.options) ? q.options.map(String).slice(0, 6) : [];
  const hints = Array.isArray(q.hints) ? q.hints.map(String).filter(Boolean).slice(0, 4) : [];
  return {
    id: 'ai-' + Date.now().toString(36) + '-' + index,
    ai: true,
    category: String(q.category || 'Общие знания'),
    difficulty: Math.max(1, Math.min(5, Number(q.difficulty) || 2.5)),
    kind,
    text: String(q.text || '').trim(),
    options,
    correct: String(q.correct || '').trim(),
    acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(String).filter(Boolean).slice(0, 8) : [],
    explanation: String(q.explanation || '').trim(),
    hints,
    conceptKey: String(q.conceptKey || '').trim().toLowerCase(),
    icon: String(q.icon || '✦').slice(0, 8),
    pairs: Array.isArray(q.pairs) ? q.pairs.slice(0, 6).map(p => ({ left: String(p.left || ''), right: String(p.right || '') })) : [],
    items: Array.isArray(q.items) ? q.items.map(String).slice(0, 7) : [],
    correctOrder: Array.isArray(q.correctOrder) ? q.correctOrder.map(String).slice(0, 7) : [],
    multipleCorrect: Array.isArray(q.multipleCorrect) ? q.multipleCorrect.map(String).slice(0, 6) : [],
    clueLines: Array.isArray(q.clueLines) ? q.clueLines.map(String).filter(Boolean).slice(0, 4) : [],
    timeLimit: Math.max(0, Math.min(60, Number(q.timeLimit) || 0)),
    speechText: String(q.speechText || '').trim(),
    speechLang: String(q.speechLang || '').trim()
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: MODEL
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'Gemini is not configured' });

  const body = req.body || {};
  const profile = String(body.profile || 'Игрок').slice(0, 40);
  const age = Math.max(6, Math.min(99, Number(body.age) || 13));
  const topic = String(body.topic || 'Всё').slice(0, 40);
  const challenge = String(body.challenge || 'normal').slice(0, 20);
  const usedConcepts = cleanList(body.usedConcepts, 1000);
  const usedTexts = cleanList(body.usedTexts, 160);
  const count = Math.max(5, Math.min(12, Number(body.count) || 10));

  const allowedKinds = [
    'choices','open','truefalse','odd','sequence','clues','closest','multiple',
    'order','match','fill','compare','rapid','scenario','listen','estimate',
    'category','two-step','reverse','memory'
  ];

  const system = `You generate a premium daily family quiz in Russian for one player.
The quiz must feel like a game, not a worksheet. Facts must be correct and unambiguous.
Adapt to the player's age and requested topic. Avoid childish wording for adults.
Never repeat a conceptKey from the provided usedConcepts list. A conceptKey identifies the underlying fact/skill, not the wording.
Never reuse, lightly paraphrase, or recycle a question from usedTexts.
Use a wide variety of mechanics. No more than 2 questions of the same kind.
Do not generate trick questions with disputed answers.
For math, keep calculations mental-math friendly unless difficulty is high.
For listen questions, put the word/phrase to be spoken in speechText and do not reveal it in text.
Every question must include 3 progressive hints:
1) a subtle nudge,
2) a stronger clue,
3) an almost-answer that still requires the player to answer.
Hints must never directly state the final answer.
conceptKey must be compact and stable, e.g. "geo:capital:chile", "science:inertia:bus", "math:percent:discount".
Return JSON only.`;

  const formatGuide = `
Allowed kinds and required fields:
- choices: text, options(4), correct
- open: text, correct, acceptedAnswers
- truefalse: text, options ["Правда","Ложь"], correct
- odd: text, options(4), correct
- sequence: text, options(4) OR open answer, correct
- clues: text="Угадай по подсказкам", clueLines(3-4), correct, acceptedAnswers
- closest: text, options(4 numeric/plausible), correct
- multiple: text, options(4-6), multipleCorrect(2-3), correct="multiple"
- order: text, items(4-6), correctOrder(same items in correct order), correct="order"
- match: text, pairs(4), correct="match"
- fill: text with "___", correct, acceptedAnswers
- compare: text, options(2-4), correct
- rapid: short text, options(4), correct, timeLimit 8-15
- scenario: practical mini-situation, options(4), correct
- listen: text="Что ты услышал/что это значит?", speechText, speechLang ("en" or "ru"), options(4) or open, correct
- estimate: text asks for closest estimate, options(4), correct
- category: text asks to group/classify, options(4), correct
- two-step: text needs two reasoning steps, options(4), correct
- reverse: give result and ask for cause/source, options(4), correct
- memory: short memory challenge, clueLines(1-2) then text question, options(4), correct

Output object:
{"questions":[{category,difficulty,kind,text,options,correct,acceptedAnswers,explanation,hints,conceptKey,icon,pairs,items,correctOrder,multipleCorrect,clueLines,timeLimit,speechText,speechLang}]}
Use only these categories: География, Наука, История, Английский, Математика, Общие знания, Философия.
Allowed kinds: choices, open, truefalse, odd, sequence, clues, closest, multiple, order, match, fill, compare, rapid, scenario, listen, estimate, category, two-step, reverse, memory.
`;

  const prompt = `Create exactly ${count} fresh questions.
Player: ${profile}, age ${age}.
Topic: ${topic}.
Difficulty setting: ${challenge}.
Used concept keys (FORBIDDEN): ${JSON.stringify(usedConcepts)}
Recently shown question texts (FORBIDDEN even as paraphrases): ${JSON.stringify(usedTexts)}
${formatGuide}`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 1.05,
            topP: 0.95
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini quiz error', response.status, JSON.stringify(data).slice(0, 1000));
      return res.status(502).json({ error: 'Gemini generation failed', status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw e;
      parsed = JSON.parse(match[0]);
    }

    const usedSet = new Set(usedConcepts.map(x => String(x).toLowerCase()));
    const seenHere = new Set();
    const questions = (parsed.questions || []).map(normalizeQuestion).filter(q => {
      if (!q.text || !q.correct || !q.conceptKey) return false;
      if (!allowedKinds.includes(q.kind)) return false;
      if (usedSet.has(q.conceptKey) || seenHere.has(q.conceptKey)) return false;
      seenHere.add(q.conceptKey);
      return true;
    }).slice(0, count);

    if (questions.length < Math.min(5, count)) {
      return res.status(502).json({ error: 'Not enough unique questions generated' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, model: MODEL, questions });
  } catch (error) {
    console.error('Gemini quiz exception', error);
    return res.status(500).json({ error: 'Quiz generation failed' });
  }
}
