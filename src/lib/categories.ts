import type { CategoryId } from '../types';

export interface CategoryMeta { id: CategoryId; label: string; color: string }

/** Gedeckte, unterscheidbare Markerfarben; weißes Icon darauf erreicht mindestens 3:1. */
export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  natur: { id: 'natur', label: 'Natur und Umwelt', color: '#3F7A51' },
  wald: { id: 'wald', label: 'Wald und Bäume', color: '#1F4D3A' },
  botanik: { id: 'botanik', label: 'Botanische Gärten', color: '#8A4F7D' },
  fuehrungen: { id: 'fuehrungen', label: 'Führungen und Exkursionen', color: '#2F6F8F' },
  tiere: { id: 'tiere', label: 'Tiere und Artenschutz', color: '#9C5F22' },
  familie: { id: 'familie', label: 'Familien und Kinder', color: '#B7503A' },
  kultur: { id: 'kultur', label: 'Kultur und Geschichte', color: '#7C6840' },
  sonstige: { id: 'sonstige', label: 'Sonstige Veranstaltungen', color: '#66707A' },
};
