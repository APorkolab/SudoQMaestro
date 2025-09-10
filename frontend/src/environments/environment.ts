export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  oauthClientId: '',
  enableDebugTools: true,
  enableMocking: false,
  logLevel: 'debug',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version: require('../../package.json').version,
};
