import {
  manifestSchema,
  packSchema,
  type Challenge,
  type CollocationItem,
  type ContentPack,
  type Domain,
  type GrammarTopic,
  type IdiomItem,
  type VocabItem,
} from './schema';

export interface ContentIndex {
  challenges: Map<string, Challenge>;
  vocab: Map<string, VocabItem>;
  idioms: Map<string, IdiomItem>;
  collocations: Map<string, CollocationItem>;
  grammarTopics: GrammarTopic[];
  byDomain: Map<Domain, Challenge[]>;
}

let cached: ContentIndex | null = null;
let loading: Promise<ContentIndex> | null = null;

function indexPacks(packs: ContentPack[]): ContentIndex {
  const index: ContentIndex = {
    challenges: new Map(),
    vocab: new Map(),
    idioms: new Map(),
    collocations: new Map(),
    grammarTopics: [],
    byDomain: new Map(),
  };
  for (const pack of packs) {
    for (const v of pack.vocab ?? []) index.vocab.set(v.id, v);
    for (const i of pack.idioms ?? []) index.idioms.set(i.id, i);
    for (const c of pack.collocations ?? []) index.collocations.set(c.id, c);
    index.grammarTopics.push(...(pack.grammarTopics ?? []));
    for (const ch of pack.challenges ?? []) {
      index.challenges.set(ch.id, ch);
      const list = index.byDomain.get(ch.domain) ?? [];
      list.push(ch);
      index.byDomain.set(ch.domain, list);
    }
  }
  return index;
}

/** Carga y valida todos los packs de contenido (una sola vez por sesión). */
export async function loadContent(): Promise<ContentIndex> {
  if (cached) return cached;
  if (loading) return loading;
  loading = (async () => {
    const base = import.meta.env.BASE_URL;
    const manifestRaw = await fetch(`${base}content/manifest.json`).then((r) => r.json());
    const manifest = manifestSchema.parse(manifestRaw);
    const packs = await Promise.all(
      manifest.packs.map(async (name) => {
        const raw = await fetch(`${base}content/${name}.json`).then((r) => r.json());
        return packSchema.parse(raw);
      }),
    );
    cached = indexPacks(packs);
    return cached;
  })();
  return loading;
}

export function challengesForDomains(index: ContentIndex, domains: Domain[]): Challenge[] {
  return domains.flatMap((d) => index.byDomain.get(d) ?? []);
}
