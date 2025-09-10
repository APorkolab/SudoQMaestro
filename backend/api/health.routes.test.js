import request from 'supertest';
import express from 'express';

import healthRouter from './health.routes.js';

// Simplified health routes test without mongoose mocking
// Since we're using in-memory MongoDB for testing, the routes should work

describe('Health Routes', () => {
  const app = express();
  app.use('/', healthRouter);

  it('GET /health should respond', async () => {
    const res = await request(app).get('/health');
    
    // Just test that the endpoint responds with a proper structure
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('checks');
  });

  it('GET /ready should respond', async () => {
    const res = await request(app).get('/ready');
    
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });

  it('GET /live returns ALIVE', async () => {
    const res = await request(app).get('/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ALIVE');
  });
});
