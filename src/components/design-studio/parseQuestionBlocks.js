// Extracts the structured question block the consultant AI emits when it needs
// design info. The block is a fenced code chunk marked ```questions``` or ```json``` with a
// JSON body: { "questions": [ { key, title, type, options } ] }.
export function parseQuestionBlocks(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Locate the questions JSON payload (closed or unclosed fence, or raw JSON)
  let rawJson = null;
  const closedMatch = text.match(/```(?:questions|json)?\s*([\s\S]*?)```/i);
  if (closedMatch && closedMatch[1].includes('"questions"')) {
    rawJson = closedMatch[1];
  } else {
    const unclosedMatch = text.match(/```(?:questions|json)?\s*([\s\S]*)$/i);
    if (unclosedMatch && unclosedMatch[1].includes('"questions"')) {
      rawJson = unclosedMatch[1];
    } else if (text.includes('"questions"')) {
      rawJson = text;
    }
  }

  if (!rawJson) return null;

  const start = rawJson.indexOf('{');
  if (start === -1) return null;

  const extractQuestions = (obj) => {
    const questions = (obj?.questions || [])
      .filter((q) => q && Array.isArray(q.options) && q.options.length > 0)
      .map((q) => ({
        key: q.key || q.title,
        title: q.title || q.key,
        type: q.type === 'radio' ? 'radio' : 'checkbox',
        options: q.options.map((o) => String(o)),
      }));
    return questions.length > 0 ? questions : null;
  };

  // 2. Try parsing entire JSON slice if closed with }
  const end = rawJson.lastIndexOf('}');
  if (end > start) {
    try {
      const obj = JSON.parse(rawJson.slice(start, end + 1));
      const q = extractQuestions(obj);
      if (q) return q;
    } catch {
      // Fall through to recovery if trailing item was incomplete
    }
  }

  // 3. Resilient recovery for truncated JSON: find the last completed question item
  let searchIdx = rawJson.length;
  while (true) {
    const lastBrace = rawJson.lastIndexOf('}', searchIdx);
    if (lastBrace <= start) break;
    try {
      const candidate = rawJson.slice(start, lastBrace + 1) + ']}';
      const obj = JSON.parse(candidate);
      const q = extractQuestions(obj);
      if (q) return q;
    } catch {
      // try earlier brace
    }
    searchIdx = lastBrace - 1;
  }

  return null;
}

// Removes the fenced ```questions``` block so the raw JSON is never shown as
// plain text in the bubble.
export function stripQuestionBlock(text) {
  if (!text) return '';
  return text
    .replace(/```questions\s*[\s\S]*?(?:```|$)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Removes any fenced code block whose body is a JSON object (```json, ```questions,
// or an unlabeled fence containing {...}), as well as any unclosed questions block.
// Internal AI contract blocks (ready prompt, structured questions) are hidden from
// the customer while plain text stays intact.
export function stripAssistantBlocks(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Remove closed code blocks that represent internal JSON/questions contracts
    .replace(/```(?:json|questions)?\s*([\s\S]*?)```/gi, (match, body) => {
      const trimmed = (body || '').trim();
      if (/^\{[\s\S]*\}$/.test(trimmed)) return '';
      if (match.toLowerCase().startsWith('```questions')) return '';
      return match;
    })
    // 2. Remove any unclosed questions or json code fences at the end of the text
    .replace(/```(?:questions|json)\s*[\s\S]*$/gi, '')
    // 3. Remove raw unclosed `{ "questions": ...` if somehow emitted without fence
    .replace(/\{\s*"questions"\s*:[\s\S]*$/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
