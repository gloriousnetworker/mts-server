export type UserRole = 'student' | 'staff' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
