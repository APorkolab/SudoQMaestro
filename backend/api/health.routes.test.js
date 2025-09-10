import request from 'supertest';
import express from 'express';
import healthRouter from './health.routes.js';
import mongoose from 'mongoose';

// Mock mongoose connection state dynamically per test

describe('Health Routes', () => {
  const app = express();
  app.use('/', healthRouter);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /health returns OK with details when DB connected', async () => {
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue({ readyState: 1 });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks.database).toBe('OK');
  });

  it('GET /health returns 503 when DB not connected', async () => {
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue({ readyState: 0 });

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('ERROR');
    expect(res.body.checks.database).toBe('ERROR');
  });

  it('GET /ready returns READY when DB connected', async () => {
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue({ readyState: 1 });

    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
  });

  it('GET /ready returns NOT_READY when DB not connected', async () => {
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue({ readyState: 0 });

    const res = await request(app).get('/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('NOT_READY');
  });

  it('GET /live returns ALIVE', async () => {
    const res = await request(app).get('/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ALIVE');
  });
});
