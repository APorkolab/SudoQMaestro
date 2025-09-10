describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load config with defaults', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    
    const { default: config } = await import('./env.js');
    
    expect(config.port).toBe(3000);
    expect(config.nodeEnv).toBe('test');
    expect(config.isTest).toBe(true);
  });

  it('should have google config properties', async () => {
    const { default: config } = await import('./env.js');
    
    expect(config.google).toHaveProperty('clientId');
    expect(config.google).toHaveProperty('clientSecret');
  });

  it('should have rate limit config', async () => {
    const { default: config } = await import('./env.js');
    
    expect(config.rateLimit).toHaveProperty('windowMs');
    expect(config.rateLimit).toHaveProperty('max');
  });
});
