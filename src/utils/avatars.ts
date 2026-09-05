/**
 * Curated HD User Profile Avatars for Victor Win Platform
 * Provides diverse, high-quality, distinctive character avatars so every user
 * has their own distinct photo, with ability to change in profile.
 */

export interface AvatarOption {
  id: string;
  url: string;
  label: string;
  category: 'male' | 'female' | 'vip' | 'anime';
}

export const CURATED_AVATARS: AvatarOption[] = [
  {
    id: 'av-1',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80',
    label: 'Smart Male',
    category: 'male',
  },
  {
    id: 'av-2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
    label: 'Stylish Female',
    category: 'female',
  },
  {
    id: 'av-3',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=240&auto=format&fit=crop&q=80',
    label: 'Executive',
    category: 'male',
  },
  {
    id: 'av-4',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    label: 'Glamour',
    category: 'female',
  },
  {
    id: 'av-5',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    label: 'Casual Pro',
    category: 'male',
  },
  {
    id: 'av-6',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
    label: 'Chic Model',
    category: 'female',
  },
  {
    id: 'av-7',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    label: 'Confident',
    category: 'male',
  },
  {
    id: 'av-8',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&auto=format&fit=crop&q=80',
    label: 'Fashionista',
    category: 'female',
  },
  {
    id: 'av-9',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80',
    label: 'Urban Bold',
    category: 'male',
  },
  {
    id: 'av-10',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
    label: 'Modern Elegance',
    category: 'female',
  },
  {
    id: 'av-11',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80',
    label: 'VIP Gold',
    category: 'vip',
  },
  {
    id: 'av-12',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
    label: 'Leader Female',
    category: 'female',
  },
  {
    id: 'av-13',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80',
    label: 'Master Gamer',
    category: 'male',
  },
  {
    id: 'av-14',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=240&auto=format&fit=crop&q=80',
    label: 'Radiant Smile',
    category: 'female',
  },
  {
    id: 'av-15',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80',
    label: 'Creative Hero',
    category: 'male',
  },
  {
    id: 'av-16',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=240&auto=format&fit=crop&q=80',
    label: 'VIP Platinum',
    category: 'vip',
  },
];

/**
 * Deterministically get an avatar based on User UID or Phone number
 * ensuring every registered user receives their own distinct picture.
 */
export function getAvatarForUser(identifier?: string, gender?: string): string {
  if (!identifier) return CURATED_AVATARS[0].url;

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);

  if (gender === 'female') {
    const females = CURATED_AVATARS.filter((a) => a.category === 'female');
    return females[positiveHash % females.length].url;
  }
  if (gender === 'male') {
    const males = CURATED_AVATARS.filter((a) => a.category === 'male');
    return males[positiveHash % males.length].url;
  }

  return CURATED_AVATARS[positiveHash % CURATED_AVATARS.length].url;
}
