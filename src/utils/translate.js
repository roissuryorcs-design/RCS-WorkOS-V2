// Free, no-API-key translation for Updates/comments free text — distinct
// from the app's own UI bilingual system (src/i18n/translations.js),
// which only ever covers fixed app strings, never what a user types.
// MyMemory's anonymous tier caps at 5000 words/day per IP; fine for a
// small team, no billing account needed (unlike Google Cloud Translate).
const cache = new Map();

export async function translateText(text, sourceLang, targetLang) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";

  const key = `${sourceLang}|${targetLang}:${trimmed}`;
  if (cache.has(key)) return cache.get(key);

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLang}|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate request failed (${res.status})`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error("No translation returned");

  cache.set(key, translated);
  return translated;
}
