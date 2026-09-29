/**
 * Datos de prueba compartidos por los tests E2E.
 *
 * Ajustar las credenciales al entorno de integración contra el que se ejecuten
 * los tests (perfil `test`).
 */
export const testUsers = {
  valid: {
    username: 'admin',
    password: 'admin123',
  },
  invalid: {
    username: 'admin',
    password: 'wrong-password',
  },
};

/**
 * Genera los datos de un usuario nuevo con un `username` único para evitar
 * colisiones al reejecutar los tests contra el mismo backend.
 */
export function buildNewUser(): {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
} {
  const suffix = Date.now().toString().slice(-8);
  return {
    username: `e2e_user_${suffix}`,
    password: 'Test1234!',
    email: `e2e_user_${suffix}@example.com`,
    firstName: 'E2E',
    lastName: 'Test',
  };
}

/**
 * Genera los datos de un perfil nuevo con un nombre único para evitar
 * colisiones entre ejecuciones del suite de E2E.
 */
export function buildNewProfile(): {
  name: string;
  description: string;
} {
  const suffix = Date.now().toString().slice(-8);
  return {
    name: `e2e_profile_${suffix}`,
    description: `Perfil de prueba ${suffix}`,
  };
}

/**
 * Genera los datos de un parámetro nuevo con clave única para evitar
 * colisiones al ejecutar la suite E2E repetidamente.
 */
export function buildNewParameter(): {
  code: string;
  description: string;
  value: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE';
} {
  const suffix = Date.now().toString().slice(-8);
  return {
    code: `E2E_PARAM_${suffix}`,
    description: `Parámetro de prueba ${suffix}`,
    value: `value-${suffix}`,
    type: 'STRING',
  };
}
