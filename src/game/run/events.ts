export interface RunEvent {
  id: string;
  title: string;
  text: string;
  options: {
    label: string;
    /** efectos sencillos sobre el run */
    effect:
      | { kind: 'coins'; amount: number }
      | { kind: 'heal'; amount: number }
      | { kind: 'card'; rarity: 'rara' | 'epica' }
      | { kind: 'nothing' };
  }[];
}

export const RUN_EVENTS: Record<string, RunEvent> = {
  'biblioteca-olvidada': {
    id: 'biblioteca-olvidada',
    title: 'La Biblioteca Olvidada',
    text: 'Entre estanterías cubiertas de polvo brilla un lomo dorado. Un susurro recorre la sala: «Llévame contigo… o déjame descansar».',
    options: [
      { label: 'Tomar el libro dorado', effect: { kind: 'card', rarity: 'rara' } },
      { label: 'Dejarlo y descansar un rato (+10 concentración)', effect: { kind: 'heal', amount: 10 } },
    ],
  },
  'mercader-errante': {
    id: 'mercader-errante',
    title: 'El Buhonero Errante',
    text: 'Un buhonero de sonrisa torcida te ofrece un trato: «Unas monedas a cambio de nada… hoy estoy generoso. O quizá prefieras algo más raro».',
    options: [
      { label: 'Aceptar la bolsa de monedas (+30)', effect: { kind: 'coins', amount: 30 } },
      { label: 'Pedir «algo más raro»', effect: { kind: 'card', rarity: 'epica' } },
    ],
  },
  'fuente-de-tinta': {
    id: 'fuente-de-tinta',
    title: 'La Fuente de Tinta',
    text: 'Una fuente mana tinta iridiscente. Dicen que beber de ella aclara la mente… o la nubla para siempre.',
    options: [
      { label: 'Beber (+18 concentración)', effect: { kind: 'heal', amount: 18 } },
      { label: 'Llenar un frasco y venderlo (+20 monedas)', effect: { kind: 'coins', amount: 20 } },
      { label: 'Seguir de largo', effect: { kind: 'nothing' } },
    ],
  },
};

export const EVENT_IDS = Object.keys(RUN_EVENTS);
