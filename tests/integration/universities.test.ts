import request from 'supertest'
import { createApp, MOCK_UNIVERSITY } from './setup/mockServer'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Universities API integration', () => {
  // ── GET /api/universities ───────────────────────────────────────────────

  describe('GET /api/universities', () => {
    it('returns 200 with an array of universities (public route)', async () => {
      const res = await request(app).get('/api/universities')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each university has the expected shape', async () => {
      const res = await request(app).get('/api/universities')

      for (const uni of res.body) {
        expect(uni).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        })
      }
    })

    it('includes the fixture university', async () => {
      const res = await request(app).get('/api/universities')

      const ids = res.body.map((u: { id: string }) => u.id)
      expect(ids).toContain(MOCK_UNIVERSITY.id)
    })

    it('does NOT require Authorization header', async () => {
      const res = await request(app).get('/api/universities')

      expect(res.status).not.toBe(401)
    })
  })

  // ── GET /api/universities/:id ───────────────────────────────────────────

  describe('GET /api/universities/:id', () => {
    it('returns university details for a known id', async () => {
      const res = await request(app).get(`/api/universities/${MOCK_UNIVERSITY.id}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        id: MOCK_UNIVERSITY.id,
        name: MOCK_UNIVERSITY.name,
        latitude: MOCK_UNIVERSITY.latitude,
        longitude: MOCK_UNIVERSITY.longitude,
      })
    })

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/universities/no-such-uni')

      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ status: 404, title: 'Not Found' })
    })

    it('is a public route', async () => {
      const res = await request(app).get(`/api/universities/${MOCK_UNIVERSITY.id}`)

      expect(res.status).not.toBe(401)
    })
  })

  // ── POST /api/universities ──────────────────────────────────────────────

  describe('POST /api/universities', () => {
    const validPayload = {
      name: 'University of Jaffna',
      latitude: 9.6615,
      longitude: 80.0255,
    }

    it('creates a university and returns 201', async () => {
      const res = await request(app)
        .post('/api/universities')
        .set('Authorization', AUTH)
        .send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: validPayload.name,
      })
    })

    it('returns 400 when name is absent', async () => {
      const res = await request(app)
        .post('/api/universities')
        .set('Authorization', AUTH)
        .send({ latitude: 9.6615, longitude: 80.0255 })

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('name')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/universities').send(validPayload)

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/universities/:id ───────────────────────────────────────────

  describe('PUT /api/universities/:id', () => {
    it('updates a university and returns 200 with merged data', async () => {
      const update = { name: 'University of Colombo (Updated)', latitude: 6.91, longitude: 79.86 }

      const res = await request(app)
        .put(`/api/universities/${MOCK_UNIVERSITY.id}`)
        .set('Authorization', AUTH)
        .send(update)

      expect(res.status).toBe(200)
      expect(res.body.name).toBe(update.name)
      expect(res.body.id).toBe(MOCK_UNIVERSITY.id)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .put('/api/universities/does-not-exist')
        .set('Authorization', AUTH)
        .send({ name: 'X' })

      expect(res.status).toBe(404)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/universities/${MOCK_UNIVERSITY.id}`)
        .send({ name: 'X' })

      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/universities/:id ────────────────────────────────────────

  describe('DELETE /api/universities/:id', () => {
    it('deletes a university and returns 204', async () => {
      const res = await request(app)
        .delete(`/api/universities/${MOCK_UNIVERSITY.id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .delete('/api/universities/no-such-uni')
        .set('Authorization', AUTH)

      expect(res.status).toBe(404)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/api/universities/${MOCK_UNIVERSITY.id}`)

      expect(res.status).toBe(401)
    })
  })
})
