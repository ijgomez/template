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
