export const environment = {
  production: true,
  apiUrl: '/api',
  oauthClientId: '',
  enableDebugTools: false,
  enableMocking: false,
  logLevel: 'error',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version: require('../../package.json').version,
};
