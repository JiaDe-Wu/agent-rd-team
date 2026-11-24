/**
 * What a person reads for a word the backend sends on the CTO page (kanban columns, segment labels, decisions, mark labels): the
 * backend sends English words, so this is the text itself. It is kept as one place to change if a label ever needs rewording.
 */
export function word(text: string | null | undefined): string {
  return text ?? ''
}
export const segLabel = word
export const decisionLabel = word
