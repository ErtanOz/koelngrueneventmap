import { Bird, CalendarDays, Flower2, Footprints, Landmark, Leaf, TreePine, Users } from 'lucide-react';
import type { CategoryId } from '../types';

const ICONS = {
  natur: Leaf, wald: TreePine, botanik: Flower2, fuehrungen: Footprints,
  tiere: Bird, familie: Users, kultur: Landmark, sonstige: CalendarDays,
} as const;

export function CategoryIcon({ id, size = 16 }: { id: CategoryId; size?: number }) {
  const Icon = ICONS[id];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}
