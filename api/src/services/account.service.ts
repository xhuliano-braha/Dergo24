import type { output } from 'zod';
import { ApiError } from '../errors/api-error';
import type {
  customerLoginSchema,
  customerRegisterSchema,
  staffAccountCreateSchema,
  staffAccountUpdateSchema,
} from '../lib/account-schemas';
import type { staffLoginSchema } from '../lib/staff-schemas';
import { accountRepository } from '../repositories/account.repository';
import { authRepository } from '../repositories/auth.repository';
import {
  permissionCodes,
  type CustomerProfile,
  type PermissionCode,
  type StaffProfile,
} from '../types/profiles';
import { throttleAuth } from '../security/auth-throttle';
import {
  issueSession,
  sessionUser,
  revokeUserSessions,
} from '../security/app-session';
import { securityRepository } from '../repositories/security.repository';

async function loginGeneration(email: string, audience: 'customer' | 'staff') {
  const { data: profile, error } = await accountRepository.findLoginProfile(
    email,
    audience,
  );
  if (error) throw new ApiError('Shërbimi nuk është i disponueshëm.', 503);
  if (!profile) return null;
  const result = await securityRepository.generation(profile.id);
  if (result.error || typeof result.data !== 'number')
    throw new ApiError('Shërbimi nuk është i disponueshëm.', 503);
  return { id: profile.id, generation: result.data };
}

function staffEmail(login: string) {
  const normalized = login.toLowerCase();
  return normalized.includes('@')
    ? normalized
    : `${normalized}@staff.dergo24.al`;
}

async function activeCustomer(id: string): Promise<CustomerProfile | null> {
  const { data: profile, error } =
    await accountRepository.findActiveCustomer(id);
  if (error) throw new ApiError('Llogaria nuk mund të ngarkohej.', 503);
  if (!profile) return null;
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
  };
}

async function activeStaff(id: string): Promise<StaffProfile | null> {
  const { data: profile, error } = await accountRepository.findActiveStaff(id);
  if (error) throw new ApiError('Llogaria nuk mund të ngarkohej.', 503);
  if (!profile) return null;
  const relation = profile.roles as unknown;
  const roleRecord = Array.isArray(relation) ? relation[0] : relation;
  if (!roleRecord || typeof roleRecord !== 'object') return null;
  const role: unknown = 'name' in roleRecord ? roleRecord.name : null;
  if (
    role !== 'admin' &&
    role !== 'dispatcher' &&
    role !== 'support' &&
    role !== 'courier'
  )
    return null;
  const links =
    'role_permissions' in roleRecord &&
    Array.isArray(roleRecord.role_permissions)
      ? roleRecord.role_permissions
      : [];
  const knownPermissions = new Set<string>(permissionCodes);
  const permissions = links.flatMap((link: unknown): PermissionCode[] => {
    if (!link || typeof link !== 'object' || !('permissions' in link))
      return [];
    const permissionRelation = link.permissions;
    const permission = Array.isArray(permissionRelation)
      ? permissionRelation[0]
      : permissionRelation;
    if (
      !permission ||
      typeof permission !== 'object' ||
      !('code' in permission)
    )
      return [];
    return typeof permission.code === 'string' &&
      knownPermissions.has(permission.code)
      ? [permission.code as PermissionCode]
      : [];
  });
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    roleId: profile.role_id,
    role,
    permissions,
  };
}

async function roleId(role: StaffProfile['role']) {
  const { data, error } = await accountRepository.findRoleByName(role);
  if (error) throw new ApiError('Roli nuk mund të ngarkohej.', 503);
  if (!data) throw new ApiError('Roli i zgjedhur nuk ekziston.', 400);
  return data.id;
}

async function rollbackUser(id: string) {
  const { error } = await authRepository.deleteUser(id);
  if (error)
    throw new ApiError(
      'Krijimi dështoi. Llogaria kërkon kontroll administrativ.',
      503,
    );
}

export const accountService = {
  async customerFromToken(token: string): Promise<CustomerProfile | null> {
    const userId = await sessionUser(token, 'customer');
    return userId ? activeCustomer(userId) : null;
  },
  async staffFromToken(token: string): Promise<StaffProfile | null> {
    const userId = await sessionUser(token, 'staff');
    return userId ? activeStaff(userId) : null;
  },
  async loginCustomer(
    input: output<typeof customerLoginSchema>,
    client: string,
  ) {
    await throttleAuth(`login:${client}:${input.email}`);
    const snapshot = await loginGeneration(input.email, 'customer');
    const { data, error } = await authRepository.signIn(
      input.email,
      input.password,
    );
    if (
      error ||
      !data.session ||
      !data.user ||
      !data.user.email_confirmed_at ||
      !snapshot ||
      snapshot.id !== data.user.id
    )
      throw new ApiError('Email ose fjalëkalim i pasaktë.', 401);
    const customer = await activeCustomer(data.user.id);
    if (!customer) throw new ApiError('Kjo llogari nuk është aktive.', 403);
    return {
      customer,
      session: await issueSession(customer.id, snapshot.generation, 'customer'),
    };
  },
  async loginStaff(input: output<typeof staffLoginSchema>, client: string) {
    await throttleAuth(`login:${client}:${staffEmail(input.login)}`);
    const snapshot = await loginGeneration(staffEmail(input.login), 'staff');
    const { data, error } = await authRepository.signIn(
      staffEmail(input.login),
      input.password,
    );
    if (
      error ||
      !data.session ||
      !data.user ||
      !data.user.email_confirmed_at ||
      !snapshot ||
      snapshot.id !== data.user.id
    )
      throw new ApiError('Përdorues ose fjalëkalim i pasaktë.', 401);
    const staff = await activeStaff(data.user.id);
    if (!staff) throw new ApiError('Kjo llogari nuk ka akses te paneli.', 403);
    return {
      staff,
      session: await issueSession(staff.id, snapshot.generation, 'staff'),
    };
  },
  async registerCustomer(
    input: output<typeof customerRegisterSchema>,
    client: string,
  ) {
    const email = input.email.toLowerCase();
    await throttleAuth(`register:${client}`, 5, 3600);
    const { data: created, error } =
      await authRepository.createUnconfirmedCustomer(
        email,
        input.password,
        input.fullName,
      );
    if (error || !created.user)
      throw new ApiError('Ky email mund të jetë regjistruar më parë.', 409);
    const acceptedAt = new Date().toISOString();
    const { error: profileError } = await accountRepository.createCustomer({
      id: created.user.id,
      full_name: input.fullName,
      email,
      phone: input.phone,
      terms_accepted_at: acceptedAt,
      privacy_accepted_at: acceptedAt,
    });
    if (profileError) {
      await rollbackUser(created.user.id);
      throw new ApiError('Llogaria nuk mund të krijohej.', 503);
    }
    const { error: emailError } = await authRepository.sendConfirmation(email);
    if (emailError)
      throw new ApiError(
        'Llogaria u krijua, por email-i nuk u dërgua. Provoni ridërgimin.',
        503,
      );
    return { verificationRequired: true };
  },
  async resendConfirmation(email: string, client: string) {
    await throttleAuth(`resend:${client}:${email}`, 3, 3600);
    await authRepository.sendConfirmation(email.toLowerCase());
    return {
      success: true,
      message: 'Nëse llogaria pret verifikim, kontrolloni email-in.',
    };
  },
  async verifyEmail(email: string, token: string, client: string) {
    await throttleAuth(`verify:${client}:${email}`, 5, 900);
    const { data, error } = await authRepository.verifyEmail(
      email.toLowerCase(),
      token,
    );
    if (error || !data.user?.email_confirmed_at)
      throw new ApiError('Kodi është i pavlefshëm ose ka skaduar.', 400);
    return { success: true };
  },
  async createStaff(
    input: output<typeof staffAccountCreateSchema>,
    actor: StaffProfile,
  ) {
    if (!actor.permissions.includes('staff.manage'))
      throw new ApiError('Vetëm administratori mund të krijojë staf.', 403);
    const email = staffEmail(input.login);
    const selectedRoleId = await roleId(input.role);
    const { data: created, error } = await authRepository.createUser(
      email,
      input.password,
      input.fullName,
    );
    if (error || !created.user)
      throw new ApiError('Ky përdorues mund të ekzistojë.', 409);
    const { error: profileError } = await accountRepository.createStaff({
      id: created.user.id,
      full_name: input.fullName,
      email,
      role_id: selectedRoleId,
      active: true,
    });
    if (profileError) {
      await rollbackUser(created.user.id);
      throw new ApiError('Llogaria e stafit nuk mund të krijohej.', 503);
    }
    return { success: true };
  },
  async updateStaff(
    id: string,
    input: output<typeof staffAccountUpdateSchema>,
    actor: StaffProfile,
  ) {
    if (!actor.permissions.includes('staff.manage'))
      throw new ApiError('Vetëm administratori mund të ndryshojë stafin.', 403);
    if (id === actor.id && (!input.active || input.role !== 'admin'))
      throw new ApiError('Nuk mund të hiqni aksesin tuaj administrativ.', 400);
    const { error } = await accountRepository.updateStaffAccess(
      id,
      {
        role_id: await roleId(input.role),
        active: input.active,
      },
      actor.id,
    );
    if (error) throw new ApiError('Llogaria nuk mund të përditësohej.', 503);
    await revokeUserSessions(id);
    if (input.newPassword) {
      await revokeUserSessions(id);
      const { error: passwordError } = await authRepository.changePassword(
        id,
        input.newPassword,
      );
      await revokeUserSessions(id);
      if (passwordError)
        throw new ApiError(
          'Roli u ruajt, por fjalëkalimi nuk u ndryshua.',
          503,
        );
    }
    return { success: true };
  },
  async changeOwnPassword(
    actor: CustomerProfile | StaffProfile,
    password: string,
    currentPassword: string,
    client: string,
  ) {
    await throttleAuth(`login:${client}:${actor.email}`);
    const { data, error: authError } = await authRepository.signIn(
      actor.email,
      currentPassword,
    );
    if (authError || !data.user || data.user.id !== actor.id)
      throw new ApiError('Fjalëkalimi aktual është i pasaktë.', 401);
    await revokeUserSessions(actor.id);
    const { error } = await authRepository.changePassword(actor.id, password);
    await revokeUserSessions(actor.id);
    if (error) throw new ApiError('Fjalëkalimi nuk mund të ndryshohej.', 503);
    return { success: true };
  },
};
