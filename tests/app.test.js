const request = require('supertest');
const app = require('../index');

describe('GET /hello', () => {
  it('responds with Hello World', async () => {
    const res = await request(app).get('/hello');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Hello World' });
  });
});
