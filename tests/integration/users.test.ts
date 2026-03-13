import request from 'supertest'
import { createApp, MOCK_USERS, MOCK_STATS } from './setup/mockServer'
import { ApiUserRole } from '../../types/backend'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Users API integration', () => {
  // ── GET /api/users ──────────────────────────────────────────────────────

  describe('GET /api/users', () => {
    it('returns 401 without auth header', async () => {
      const res = await request(app).get('/api/users')

      expect(res.status).toBe(401)
      expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' })
    })

    it('returns 401 with malformed auth header', async () => {
      const res = await request(app).get('/api/users').set('Authorization', 'Token abc')

      expect(res.status).toBe(401)
    })

    it('returns array of users when authenticated', async () => {
      const res = await request(app).get('/api/users').set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(MOCK_USERS.length)
    })

    it('each user has expected shape', async () => {
      const res = await request(app).get('/api/users').set('Authorization', AUTH)

      for (const user of res.body) {
        expect(user).toMatchObject({
          id: expect.any(String),
          fullName: expect.any(String),
          email: expect.any(String),
          role: expect.any(Number),
          createdAt: expect.any(String),
        })
      }
    })
  })

  // ── GET /api/users/stats ────────────────────────────────────────────────

  describe('GET /api/users/stats', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/users/stats')

      expect(res.status).toBe(401)
    })

    it('returns aggregate stats object', async () => {
      const res = await request(app).get('/api/users/stats').set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        hostels: { totalCount: MOCK_STATS.hostels.totalCount, last7DaysCount: expect.any(Number) },
        users: { totalCount: MOCK_STATS.users.totalCount, last7DaysCount: expect.any(Number) },
        reviews: { totalCount: MOCK_STATS.reviews.totalCount, last7DaysCount: expect.any(Number) },
      })
    })

    it('is NOT routed to /:id with id="stats"', async () => {
      // Route ordering test: /stats must match stats endpoint, not /:id
      const res = await request(app).get('/api/users/stats').set('Authorization', AUTH)

      expect(res.body).not.toHaveProperty('email')
      expect(res.body).toHaveProperty('hostels')
    })
  })

  // ── GET /api/users/role/:role ───────────────────────────────────────────

  describe('GET /api/users/role/:role', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/users/role/Owner')

      expect(res.status).toBe(401)
    })

    it('filters users by Owner role', async () => {
      const res = await request(app).get(`/api/users/role/Owner`).set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.every((u: { role: number }) => u.role === ApiUserRole.Owner)).toBe(true)
    })

    it('filters users by Student role', async () => {
      const res = await request(app).get('/api/users/role/Student').set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body.every((u: { role: number }) => u.role === ApiUserRole.Student)).toBe(true)
    })

    it('filters users by numeric role value', async () => {
      const res = await request(app)
        .get(`/api/users/role/${ApiUserRole.Admin}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body.every((u: { role: number }) => u.role === ApiUserRole.Admin)).toBe(true)
    })
  })

  // ── GET /api/users/:id ──────────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('returns a single user by id', async () => {
      const target = MOCK_USERS[0]
      const res = await request(app).get(`/api/users/${target.id}`).set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(target.id)
      expect(res.body.email).toBe(target.email)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/api/users/non-existent-999').set('Authorization', AUTH)

      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ status: 404, title: 'Not Found' })
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/users/${MOCK_USERS[0].id}`)

      expect(res.status).toBe(401)
    })
  })

  // ── POST /api/users ─────────────────────────────────────────────────────

  describe('POST /api/users', () => {
    const validPayload = {
      fullName: 'New Student',
      email: 'newstudent@example.com',
      phoneNumber: '+94744444444',
      role: ApiUserRole.Student,
    }

    it('creates a user and returns 201', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', AUTH)
        .send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        fullName: validPayload.fullName,
        email: validPayload.email,
        role: validPayload.role,
      })
    })

    it('returns 400 when any required field is absent', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', AUTH)
        .send({ email: 'incomplete@example.com' })

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/users').send(validPayload)

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/users/:id ──────────────────────────────────────────────────

  describe('PUT /api/users/:id', () => {
    it('updates a user and returns 200 with merged data', async () => {
      const target = MOCK_USERS[1]
      const update = { fullName: 'Bob Updated', phoneNumber: '+94799999999', role: target.role }

      const res = await request(app)
        .put(`/api/users/${target.id}`)
        .set('Authorization', AUTH)
        .send(update)

      expect(res.status).toBe(200)
      expect(res.body.fullName).toBe(update.fullName)
      expect(res.body.id).toBe(target.id)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .put('/api/users/does-not-exist')
        .set('Authorization', AUTH)
        .send({ fullName: 'X', phoneNumber: '+0', role: 0 })

      expect(res.status).toBe(404)
    })

    it('returns 400 when body is incomplete', async () => {
      const res = await request(app)
        .put(`/api/users/${MOCK_USERS[0].id}`)
        .set('Authorization', AUTH)
        .send({})

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/users/${MOCK_USERS[0].id}`)
        .send({ fullName: 'X', phoneNumber: '+0', role: 0 })

      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/users/:id ───────────────────────────────────────────────

  describe('DELETE /api/users/:id', () => {
    it('returns 204 for an existing user', async () => {
      const res = await request(app)
        .delete(`/api/users/${MOCK_USERS[0].id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/users/no-such-user').set('Authorization', AUTH)

      expect(res.status).toBe(404)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/api/users/${MOCK_USERS[0].id}`)

      expect(res.status).toBe(401)
    })
  })
})
