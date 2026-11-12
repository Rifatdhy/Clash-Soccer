/**
 * A new FAQ row is a local draft until both fields have content. Persisting it
 * early sends empty strings to the API, which rejects the row and leaves the
 * admin staring at a 400 with no way to finish editing.
 */
export function canPersistFaq(faq: { question: string; answer: string }): boolean {
  return faq.question.trim().length > 0 && faq.answer.trim().length > 0;
}
