import request from 'supertest'
import { createApp, MOCK_TOKENS } from './setup/mockServer'

const app = createApp()

describe('Auth API integration', () => {
  // ── POST /api/auth/login ────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns auth tokens for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'ValidPass1!' })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        accessTokenExpiresAt: expect.any(String),
        userId: expect.any(String),
        email: 'user@example.com',
        role: expect.any(Number),
      })
    })

    it('echos the submitted email in the token response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unique@test.com', password: 'pass' })

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('unique@test.com')
    })

    it('returns 401 for wrong-password sentinel value', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrong-password' })

      expect(res.status).toBe(401)
      expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' })
    })

    it('returns 400 when email is absent', async () => {
      const res = await request(app).post('/api/auth/login').send({ password: 'ValidPass1!' })

      expect(res.status).toBe(400)
      expect(res.body.status).toBe(400)
    })

    it('returns 400 when password is absent', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'user@example.com' })

      expect(res.status).toBe(400)
    })

    it('returns 400 for an empty body', async () => {
      const res = await request(app).post('/api/auth/login').send({})

      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/register ─────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    const validPayload = {
      fullName: 'New User',
      email: 'newuser@example.com',
      phoneNumber: '+94700000000',
      password: 'Pass123!',
      role: 0,
    }

    it('creates a user and returns 201 with auth tokens', async () => {
      const res = await request(app).post('/api/auth/register').send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        email: validPayload.email,
      })
    })

    it('returns 400 when fullName is missing', async () => {
      const { fullName: _omit, ...partial } = validPayload
      const res = await request(app).post('/api/auth/register').send(partial)

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('required')
    })

    it('returns 400 when phoneNumber is missing', async () => {
      const { phoneNumber: _omit, ...partial } = validPayload
      const res = await request(app).post('/api/auth/register').send(partial)

      expect(res.status).toBe(400)
    })

    it('returns 400 for a completely empty body', async () => {
      const res = await request(app).post('/api/auth/register').send({})

      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/refresh ──────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('returns refreshed tokens', async () => {
      const res = await request(app).post('/api/auth/refresh')

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBe(MOCK_TOKENS.accessToken)
      expect(res.body.userId).toBe(MOCK_TOKENS.userId)
    })
  })

  // ── POST /api/auth/logout ───────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('returns 204 No Content', async () => {
      const res = await request(app).post('/api/auth/logout')

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 204 regardless of auth header presence', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer some-token')

      expect(res.status).toBe(204)
    })
  })
})
