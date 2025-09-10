import request from 'supertest';
import express from 'express';

import authRouter from './auth.routes.js';

// Simplified auth routes test without passport mocking
// Focus on testing the basic route structure

describe('Auth Routes', () => {

  const createApp = (user = null) => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = user;
      // stub logout
      req.logout = (cb) => cb && cb();
      next();
    });
    app.use('/api/auth', authRouter);
    return app;
  };

  it('GET /current-user returns 401 when not authenticated', async () => {
    const app = createApp(null);
    const res = await request(app).get('/api/auth/current-user');
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('Not authenticated');
  });

  it('GET /current-user returns user when authenticated', async () => {
    const user = { id: 'u1', name: 'Alice' };
    const app = createApp(user);
    const res = await request(app).get('/api/auth/current-user');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it('GET /logout redirects', async () => {
    const app = createApp({ id: 'u1' });
    const res = await request(app).get('/api/auth/logout');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});
