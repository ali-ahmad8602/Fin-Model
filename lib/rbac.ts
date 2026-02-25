/**
 * Role-Based Access Control helpers.
 * Centralizes permission checks for all 4 roles.
 */

export type Role = 'fund_manager' | 'cro' | 'viewer' | 'super_admin';

/** Roles that can see ALL funds/loans (not just their own) */
const ALL_VIEW_ROLES: Role[] = ['cro', 'viewer', 'super_admin'];

/** Roles that can perform mutations (create/update/delete) on funds/loans */
const MUTATE_ROLES: Role[] = ['fund_manager', 'cro', 'super_admin'];

/** Roles that can manage users (approve, change roles, etc.) */
const USER_MGMT_ROLES: Role[] = ['cro', 'super_admin'];

/** Can this role see all funds/loans across all managers? */
export function canViewAll(role: string): boolean {
    return ALL_VIEW_ROLES.includes(role as Role);
}

/** Can this role create/update/delete funds and loans? */
export function canMutate(role: string): boolean {
    return MUTATE_ROLES.includes(role as Role);
}

/** Can this role manage other users? */
export function canManageUsers(role: string): boolean {
    return USER_MGMT_ROLES.includes(role as Role);
}

/** Is this the super admin? */
export function isAdmin(role: string): boolean {
    return role === 'super_admin';
}
