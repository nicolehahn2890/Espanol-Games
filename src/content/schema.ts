import { z } from 'zod';

/** Dominios de contenido: cada enemigo, reto y nodo del árbol pertenece a uno. */
export const DOMAINS = [
  'subjuntivo',
  'pasados',
  'ser-estar',
  'preposiciones',
  'se-construcciones',
  'registro',
  'conectores',
  'vocab-c1',
  'vocab-c2',
  'modismos',
  'colocaciones',
  'falsos-amigos',
  'sinonimos',
] as const;

export const domainSchema = z.enum(DOMAINS);
export type Domain = z.infer<typeof domainSchema>;

export const registerSchema = z.enum(['culto', 'neutro', 'coloquial', 'literario']);
export type Register = z.infer<typeof registerSchema>;

export const vocabItemSchema = z.object({
  id: z.string().regex(/^v-\d{4}$/),
  lemma: z.string().min(1),
  pos: z.enum(['sust', 'verbo', 'adj', 'adv', 'expr']),
  definitionEs: z.string().min(1),
  glossDe: z.string().optional(),
  register: registerSchema.optional(),
  domain: domainSchema,
  frequencyRank: z.number().int().positive().optional(),
  examples: z.array(z.string().min(1)).min(1),
});
export type VocabItem = z.infer<typeof vocabItemSchema>;

export const challengeTypeSchema = z.enum([
  'cloze-typed',
  'cloze-choice',
  'error-spot',
  'nuance-choice',
  'collocation-match',
]);
export type ChallengeType = z.infer<typeof challengeTypeSchema>;

/**
 * Un reto. La frase contiene el hueco entre llaves: "Ojalá {hubiera sabido} antes…".
 * Para los tipos de elección, `distractors` contiene las opciones incorrectas.
 */
export const challengeSchema = z
  .object({
    id: z.string().regex(/^c-\d{4}$/),
    type: challengeTypeSchema,
    domain: domainSchema,
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sentence: z.string().regex(/\{[^}]+\}/, 'la frase debe contener un hueco {…}'),
    answer: z.string().min(1),
    acceptedAlt: z.array(z.string().min(1)).optional(),
    distractors: z.array(z.string().min(1)).optional(),
    explanation: z.string().min(1),
    itemRef: z.string().optional(),
    source: z.enum(['tatoeba', 'curado']).optional(),
  })
  .refine(
    (c) =>
      c.type === 'cloze-typed' || c.type === 'error-spot' || (c.distractors?.length ?? 0) >= 2,
    { message: 'los retos de elección necesitan al menos 2 distractores' },
  );
export type Challenge = z.infer<typeof challengeSchema>;

export const idiomItemSchema = z.object({
  id: z.string().regex(/^i-\d{4}$/),
  phrase: z.string().min(1),
  meaningEs: z.string().min(1),
  literalDe: z.string().optional(),
  example: z.string().min(1),
  register: registerSchema,
});
export type IdiomItem = z.infer<typeof idiomItemSchema>;

export const collocationItemSchema = z.object({
  id: z.string().regex(/^col-\d{4}$/),
  base: z.string().min(1),
  collocates: z.array(z.string().min(1)).min(1),
  antiCollocates: z.array(z.string().min(1)),
  example: z.string().min(1),
});
export type CollocationItem = z.infer<typeof collocationItemSchema>;

export const grammarTopicSchema = z.object({
  id: z.string().regex(/^g-\d{4}$/),
  title: z.string().min(1),
  level: z.enum(['C1', 'C2']),
  summaryEs: z.string().min(1),
  domain: domainSchema,
  challengeIds: z.array(z.string()),
});
export type GrammarTopic = z.infer<typeof grammarTopicSchema>;

export const packSchema = z.object({
  pack: z.string().min(1),
  version: z.number().int().positive(),
  vocab: z.array(vocabItemSchema).optional(),
  challenges: z.array(challengeSchema).optional(),
  idioms: z.array(idiomItemSchema).optional(),
  collocations: z.array(collocationItemSchema).optional(),
  grammarTopics: z.array(grammarTopicSchema).optional(),
});
export type ContentPack = z.infer<typeof packSchema>;

export const manifestSchema = z.object({
  version: z.number().int().positive(),
  packs: z.array(z.string().min(1)),
});
export type ContentManifest = z.infer<typeof manifestSchema>;

/** Identidad SRS de un reto: el ítem léxico vinculado si existe, si no el propio reto. */
export function srsItemId(challenge: Challenge): string {
  return challenge.itemRef ?? challenge.id;
}
