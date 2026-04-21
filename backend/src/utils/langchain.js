// Uses @xenova/transformers — runs locally on CPU, completely free, no API key needed
// Model: all-MiniLM-L6-v2 (384-dim embeddings, ~23MB, downloads once and caches)

let _pipeline = null;

const getPipeline = async () => {
  if (_pipeline) return _pipeline;
  try {
    const { pipeline } = await import('@xenova/transformers');
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embeddings] Local model loaded: all-MiniLM-L6-v2');
    return _pipeline;
  } catch (e) {
    console.warn('[Embeddings] Failed to load local model:', e.message);
    return null;
  }
};

/**
 * Generate embedding vector for a single text string using local model.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
const embedText = async (text) => {
  const pipe = await getPipeline();
  if (!pipe) throw new Error('Embedding model not available');
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

/**
 * Cosine similarity between two vectors.
 */
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
};

/**
 * Split bylaws text into paragraphs and embed each chunk locally.
 * @param {string} bylawsText
 * @returns {Promise<Array<{text: string, embedding: number[]}>>}
 */
const embedBylaws = async (bylawsText) => {
  if (!bylawsText) return [];
  const pipe = await getPipeline();
  if (!pipe) return []; // silently skip if model unavailable

  const chunks = bylawsText.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  if (!chunks.length) return [];

  const results = [];
  for (const text of chunks) {
    const embedding = await embedText(text);
    results.push({ text, embedding });
  }
  return results;
};

/**
 * Find the most relevant bylaw chunk for a question using cosine similarity.
 * @param {string} question
 * @param {Array<{text: string, embedding: number[]}>} bylawChunks
 * @returns {Promise<string>}
 */
const findRelevantChunk = async (question, bylawChunks) => {
  if (!bylawChunks.length) return '';
  const questionVec = await embedText(question);
  const scores = bylawChunks.map(chunk => ({
    text: chunk.text,
    score: cosineSimilarity(questionVec, chunk.embedding),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].text;
};

module.exports = { embedText, embedBylaws, findRelevantChunk };
