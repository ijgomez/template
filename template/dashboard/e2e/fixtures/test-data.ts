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
