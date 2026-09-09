export const permissionCodes = [
  'shipments.view',
  'shipments.import',
  'shipments.update',
  'shipments.deliver',
  'cod.settle',
  'routes.optimize',
  'drivers.view',
  'drivers.manage',
  'quotes.view',
  'quotes.manage',
  'claims.view',
  'claims.manage',
  'ratings.view',
  'staff.view',
  'staff.manage',
  'pickup_points.manage',
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  roleId: number;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
  permissions: PermissionCode[];
};

export type CustomerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};
