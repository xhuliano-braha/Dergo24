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
import type { CustomerProfile, StaffProfile } from '../types/profiles';
import { throttleAuth } from '../security/auth-throttle';

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
  const role: unknown = profile.role;
  if (
    role !== 'admin' &&
    role !== 'dispatcher' &&
    role !== 'support' &&
    role !== 'courier'
  )
    return null;
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role,
  };
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
    const {
      data: { user },
      error,
    } = await authRepository.getUser(token);
    if (error || !user) return null;
    return activeCustomer(user.id);
  },
  async staffFromToken(token: string): Promise<StaffProfile | null> {
    const {
      data: { user },
      error,
    } = await authRepository.getUser(token);
    if (error || !user) return null;
    return activeStaff(user.id);
  },
  async loginCustomer(input: output<typeof customerLoginSchema>) {
    await throttleAuth(`login:${input.email}`);
    const { data, error } = await authRepository.signIn(
      input.email,
      input.password,
    );
    if (error || !data.session || !data.user)
      throw new ApiError('Email ose fjalëkalim i pasaktë.', 401);
    const customer = await activeCustomer(data.user.id);
    if (!customer) throw new ApiError('Kjo llogari nuk është aktive.', 403);
    return { customer, session: data.session };
  },
  async loginStaff(input: output<typeof staffLoginSchema>) {
    await throttleAuth(`login:${staffEmail(input.login)}`);
    const { data, error } = await authRepository.signIn(
      staffEmail(input.login),
      input.password,
    );
    if (error || !data.session || !data.user)
      throw new ApiError('Përdorues ose fjalëkalim i pasaktë.', 401);
    const staff = await activeStaff(data.user.id);
    if (!staff) throw new ApiError('Kjo llogari nuk ka akses te paneli.', 403);
    return { staff, session: data.session };
  },
  async registerCustomer(input: output<typeof customerRegisterSchema>) {
    const email = input.email.toLowerCase();
    await throttleAuth(`register:${email}`, 3);
    const { data: created, error } = await authRepository.createUser(
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
    const { data: signedIn, error: signInError } = await authRepository.signIn(
      email,
      input.password,
    );
    return {
      customer: {
        id: created.user.id,
        fullName: input.fullName,
        email,
        phone: input.phone,
      },
      session: signInError ? null : signedIn.session,
    };
  },
  async createStaff(
    input: output<typeof staffAccountCreateSchema>,
    actor: StaffProfile,
  ) {
    if (actor.role !== 'admin')
      throw new ApiError('Vetëm administratori mund të krijojë staf.', 403);
    const email = staffEmail(input.login);
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
      role: input.role,
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
    if (actor.role !== 'admin')
      throw new ApiError('Vetëm administratori mund të ndryshojë stafin.', 403);
    if (id === actor.id && (!input.active || input.role !== 'admin'))
      throw new ApiError('Nuk mund të hiqni aksesin tuaj administrativ.', 400);
    const { data, error } = await accountRepository.updateStaff(id, {
      role: input.role,
      active: input.active,
    });
    if (error) throw new ApiError('Llogaria nuk mund të përditësohej.', 503);
    if (!data) throw new ApiError('Llogaria nuk u gjet.', 404);
    if (input.newPassword) {
      const { error: passwordError } = await authRepository.changePassword(
        id,
        input.newPassword,
      );
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
  ) {
    await throttleAuth(`login:${actor.email}`);
    const { data, error: authError } = await authRepository.signIn(actor.email, currentPassword);
    if (authError || !data.user || data.user.id !== actor.id)
      throw new ApiError('Fjalëkalimi aktual është i pasaktë.', 401);
    const { error } = await authRepository.changePassword(actor.id, password);
    if (error) throw new ApiError('Fjalëkalimi nuk mund të ndryshohej.', 503);
    return { success: true };
  },
};
