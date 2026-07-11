import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { authApi } from '@/lib/api';
import { mapUser } from '@/lib/api/mappers';
import { useSessionStore } from '@/stores/sessionStore';
import type { User, UserRole } from '@/types';

type ApiRecord = Record<string, unknown>;

export interface ApiLoginResult {
  ok: true;
  user: User;
  rawUser: ApiRecord;
}

export interface ApiLoginError {
  ok: false;
  message: string;
}

export async function loginWithApi(
  email: string,
  password: string,
  expectedRole?: UserRole,
): Promise<ApiLoginResult | ApiLoginError> {
  try {
    const response = await authApi.login(email.trim(), password);
    const rawUser = response.user as ApiRecord;
    const user = mapUser(rawUser);

    if (expectedRole && user.role !== expectedRole && user.role !== 'ADMIN') {
      return {
        ok: false,
        message: `This account is not authorized for the ${expectedRole.toLowerCase()} portal.`,
      };
    }

    if (expectedRole === 'ADMIN' && user.role !== 'ADMIN') {
      return { ok: false, message: 'Access denied. This portal is restricted to administrators.' };
    }

    useSessionStore.getState().setAuthToken(response.accessToken);
    useSessionStore.getState().setUser(user);
    return { ok: true, user, rawUser };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return { ok: false, message };
  }
}

export function routeAfterApiLogin(router: AppRouterInstance, loginUser: ApiRecord) {
  const raw = loginUser as ApiRecord;
  const user = mapUser(raw);

  if (user.role === 'ADMIN') {
    router.push('/admin');
    return;
  }

  if (user.role === 'FACILITATOR') {
    const facilitator = raw.facilitatorProfile as ApiRecord | undefined;
    const companies = facilitator?.companies as ApiRecord[] | undefined;
    const companyId = companies?.[0]?.companyId ?? (companies?.[0]?.company as ApiRecord)?.id;
    router.push(companyId ? `/facilitator/${companyId}` : '/admin');
    return;
  }

  if (user.role === 'FELLOW') {
    const fellow = raw.fellowProfile as ApiRecord | undefined;
    const companyId = fellow?.companyId ?? fellow?.company_id;
    if (companyId) {
      router.push(`/fellow/${companyId}`);
    }
    return;
  }

  if (user.role === 'COACH') {
    router.push('/coach');
  }
}
