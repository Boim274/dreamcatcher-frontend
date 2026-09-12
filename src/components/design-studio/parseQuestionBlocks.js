// Extracts the structured question block the consultant AI emits when it needs
// design info. The block is a fenced code chunk marked ```questions``` with a
// JSON body: { "questions": [ { key, title, type, options } ] }.
export function parseQuestionBlocks(text) {
  if (!text) return null;
  const regex = /```questions\s*([\s\S]*?)```/gi;
  const m = regex.exec(text);
  if (!m) return null;
  const start = m[1].indexOf('{');
  const end = m[1].lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(m[1].slice(start, end + 1));
    const questions = (obj?.questions || [])
      .filter((q) => q && Array.isArray(q.options) && q.options.length > 0)
      .map((q) => ({
        key: q.key || q.title,
        title: q.title || q.key,
        type: q.type === 'radio' ? 'radio' : 'checkbox',
        options: q.options.map((o) => String(o)),
      }));
    return questions.length > 0 ? questions : null;
  } catch {
    return null;
  }
}

// Removes the fenced ```questions``` block so the raw JSON is never shown as
// plain text in the bubble.
export function stripQuestionBlock(text) {
  if (!text) return '';
  return text.replace(/```questions\s*[\s\S]*?```/gi, '').replace(/\n{3,}/g, '\n\n').trim();
}

// Removes any fenced code block whose body is a JSON object (```json, ```questions,
// or an unlabeled fence containing {...}). Internal AI contract blocks (ready prompt,
// structured questions) are hidden from the customer while plain text stays intact.
export function stripAssistantBlocks(text) {
  if (!text) return '';
  return text
    .replace(/```(?:json|questions)?\s*([\s\S]*?)```/gi, (match, body) => {
      const trimmed = (body || '').trim();
      return trimmed.startsWith('{') && trimmed.endsWith('}') ? '' : match;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
