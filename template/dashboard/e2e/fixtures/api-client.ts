import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Cliente mínimo del backend para el setup/teardown y los tests de API de los E2E.
 *
 * La URL base coincide con `environment.test.ts` y puede sobrescribirse con la
 * variable de entorno `E2E_API_URL`.
 */
export const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8080/template/api/v1';

const USERS_PATH = '/administration/security/users';
const PROFILES_PATH = '/administration/security/profiles';
const ACTIONS_PATH = '/administration/security/actions';

export interface ApiUser {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileId: number | null;
}

export interface ApiProfile {
  id: number;
  name: string;
  description: string | null;
  actionIds: number[];
}

/**
 * Autentica contra la API y devuelve el access token.
 */
export async function apiLogin(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { username, password },
  });
  expect(response.status(), `login de ${username}`).toBe(200);
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}

/**
 * Realiza un intento de login por API sin exigir un 200, devolviendo la
 * respuesta para poder comprobar errores: 401 (credenciales inválidas) o
 * 429 con cabecera `Retry-After` (cuenta temporalmente bloqueada).
 */
export async function apiLoginAttempt(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<APIResponse> {
  return request.post(`${API_URL}/auth/login`, { data: { username, password } });
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Devuelve el id del primer perfil de referencia disponible.
 */
export async function firstProfileId(request: APIRequestContext, token: string): Promise<number> {
  const response = await request.get(`${API_URL}${PROFILES_PATH}/references`, {
    headers: authHeaders(token),
  });
  expect(response.status()).toBe(200);
  const profiles = (await response.json()) as { id: number }[];
  expect(profiles.length).toBeGreaterThan(0);
  return profiles[0].id;
}

/**
 * Busca un usuario por `username` exacto; devuelve `null` si no existe.
 */
export async function findUserByUsername(
  request: APIRequestContext,
  token: string,
  username: string,
): Promise<ApiUser | null> {
  const response = await request.get(`${API_URL}${USERS_PATH}`, {
    headers: authHeaders(token),
    params: { username, size: 50 },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { content: ApiUser[] };
  return body.content.find((user) => user.username === username) ?? null;
}

/**
 * Crea un usuario por API (setup de los casos que necesitan un registro propio).
 */
export async function apiCreateUser(
  request: APIRequestContext,
  token: string,
  data: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileId: number;
  },
): Promise<ApiUser> {
  const response = await request.post(`${API_URL}${USERS_PATH}`, {
    headers: authHeaders(token),
    data: { id: null, reportIds: [], ...data },
  });
  expect(response.status(), `alta por API de ${data.username}`).toBe(201);
  return (await response.json()) as ApiUser;
}

/**
 * Elimina un usuario por `username`; no falla si ya no existe (teardown idempotente).
 */
export async function apiDeleteUserByUsername(
  request: APIRequestContext,
  token: string,
  username: string,
): Promise<void> {
  const user = await findUserByUsername(request, token, username);
  if (user) {
    await request.delete(`${API_URL}${USERS_PATH}/${user.id}`, { headers: authHeaders(token) });
  }
}

/**
 * Resuelve los identificadores de las acciones a partir de sus códigos.
 */
export async function apiFindActionIds(
  request: APIRequestContext,
  token: string,
  actionCodes: string[],
): Promise<number[]> {
  const actionIds: number[] = [];
  for (const code of actionCodes) {
    const actions = await request.get(`${API_URL}${ACTIONS_PATH}`, {
      headers: authHeaders(token),
      params: { code, size: 50 },
    });
    expect(actions.status()).toBe(200);
    const body = (await actions.json()) as { content: { id: number; code: string }[] };
    const action = body.content.find((item) => item.code === code);
    expect(action, `acción ${code} existente`).toBeTruthy();
    actionIds.push(action!.id);
  }
  return actionIds;
}

/**
 * Crea un perfil con las acciones (por código) indicadas y devuelve su id.
 */
export async function apiCreateProfile(
  request: APIRequestContext,
  token: string,
  name: string,
  actionCodes: string[],
): Promise<number> {
  const actionIds = await apiFindActionIds(request, token, actionCodes);

  const response = await request.post(`${API_URL}${PROFILES_PATH}`, {
    headers: authHeaders(token),
    data: { id: null, name, description: 'Perfil de prueba E2E', actionIds },
  });
  expect(response.status(), `alta de perfil ${name}`).toBe(201);
  return ((await response.json()) as { id: number }).id;
}

/**
 * Devuelve el detalle de un perfil, incluidos los identificadores de sus acciones.
 */
export async function apiGetProfile(
  request: APIRequestContext,
  token: string,
  profileId: number,
): Promise<ApiProfile> {
  const response = await request.get(`${API_URL}${PROFILES_PATH}/${profileId}`, {
    headers: authHeaders(token),
  });
  expect(response.status(), `detalle del perfil ${profileId}`).toBe(200);
  return (await response.json()) as ApiProfile;
}

export async function apiDeleteProfile(
  request: APIRequestContext,
  token: string,
  profileId: number,
): Promise<void> {
  await request.delete(`${API_URL}${PROFILES_PATH}/${profileId}`, { headers: authHeaders(token) });
}

export { USERS_PATH, PROFILES_PATH };
