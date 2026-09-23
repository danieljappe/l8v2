import { User } from '../models/User';

/**
 * Serialization boundary for the User entity.
 *
 * `User.password` is `select: false`, so rows loaded from the database already
 * arrive without the hash. That does NOT cover entities built in memory — a
 * freshly created or merged user still carries the hash on the instance — so
 * every route that returns a User maps it through one of these first.
 */

/** Fields safe to expose to an authenticated admin. Everything except `password`. */
export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields safe to expose publicly on the About / booking pages. */
export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  role?: string;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    imageUrl: user.imageUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSafeUsers(users: User[]): SafeUser[] {
  return users.map(toSafeUser);
}

/**
 * Public team-member projection. Deliberately omits createdAt/updatedAt as well
 * as the hash: the About page only needs identity and contact details.
 */
export function toTeamMember(user: User): TeamMember {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    imageUrl: user.imageUrl,
    role: user.role,
  };
}

export function toTeamMembers(users: User[]): TeamMember[] {
  return users.map(toTeamMember);
}
