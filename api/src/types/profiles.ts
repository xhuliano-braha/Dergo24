export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
};

export type CustomerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};
