export const environment = {
  production: true,
  apiUrl: '/api/v1',
  tokenRefreshMargin: 60000, // 1 minute before expiration (ms)
  notification: {
    successTimeout: 5000, // 5 seconds
    errorTimeout: 8000, // 8 seconds
  },
};
