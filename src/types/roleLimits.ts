import { Role } from '@/data/heroes';

export interface RoleLimitState {
  remaining: Record<Role, number>;
}
