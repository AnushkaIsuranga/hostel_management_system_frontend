import request from 'supertest'
import { createApp, MOCK_HOSTEL } from './setup/mockServer'
import { ApiHostelStatus } from '../../types/backend'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Hostels API integration', () => {
  // ── GET /api/hostels ────────────────────────────────────────────────────

  describe('GET /api/hostels', () => {
    it('returns 200 with an array of hostels (public route)', async () => {
      const res = await request(app).get('/api/hostels')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each hostel has the expected shape', async () => {
      const res = await request(app).get('/api/hostels')

      for (const hostel of res.body) {
        expect(hostel).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          city: expect.any(String),
          status: expect.any(Number),
        })
      }
    })

    it('does NOT require Authorization header', async () => {
      const res = await request(app).get('/api/hostels')

      expect(res.status).not.toBe(401)
    })
  })

  // ── POST /api/hostels/search ────────────────────────────────────────────

  describe('POST /api/hostels/search', () => {
    it('returns 200 with ranked hostel results', async () => {
      const res = await request(app)
        .post('/api/hostels/search')
        .send({ universityId: 'university-1', maxBudget: 15000 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('search results contain hostel, distanceKm and score', async () => {
      const res = await request(app)
        .post('/api/hostels/search')
        .send({ universityId: 'university-1' })

      expect(res.body[0]).toMatchObject({
        hostel: expect.objectContaining({ id: expect.any(String) }),
        distanceKm: expect.any(Number),
        score: expect.any(Number),
      })
    })

    it('is a public route (no auth required)', async () => {
      const res = await request(app).post('/api/hostels/search').send({})

      expect(res.status).not.toBe(401)
    })
  })

  // ── GET /api/hostels/:id ────────────────────────────────────────────────

  describe('GET /api/hostels/:id', () => {
    it('returns hostel details for a known id', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        id: MOCK_HOSTEL.id,
        name: MOCK_HOSTEL.name,
        city: MOCK_HOSTEL.city,
        ownerId: MOCK_HOSTEL.ownerId,
        minPrice: expect.any(Number),
        maxPrice: expect.any(Number),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      })
    })

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/hostels/no-such-hostel')

      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ status: 404, title: 'Not Found' })
    })

    it('is a public route', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}`)

      expect(res.status).not.toBe(401)
    })
  })

  // ── POST /api/hostels ───────────────────────────────────────────────────

  describe('POST /api/hostels', () => {
    const validPayload = {
      name: 'New Hostel',
      city: 'Kandy',
      address: '5 Lake Road',
      description: 'A nice hostel',
      minPrice: 8000,
      maxPrice: 12000,
      genderPolicy: 'Male',
      status: ApiHostelStatus.Active,
    }

    it('creates a hostel and returns 201', async () => {
      const res = await request(app)
        .post('/api/hostels')
        .set('Authorization', AUTH)
        .send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: validPayload.name,
        city: validPayload.city,
      })
    })

    it('returns 400 when name is missing', async () => {
      const { name: _omit, ...partial } = validPayload
      const res = await request(app).post('/api/hostels').set('Authorization', AUTH).send(partial)

      expect(res.status).toBe(400)
    })

    it('returns 400 when city is missing', async () => {
      const res = await request(app)
        .post('/api/hostels')
        .set('Authorization', AUTH)
        .send({ name: 'Test', address: 'addr' })

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/hostels').send(validPayload)

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/hostels/:id ────────────────────────────────────────────────

  describe('PUT /api/hostels/:id', () => {
    it('updates a hostel and returns 200 with merged data', async () => {
      const update = {
        name: 'Updated Hostel',
        city: MOCK_HOSTEL.city,
        address: MOCK_HOSTEL.address,
      }

      const res = await request(app)
        .put(`/api/hostels/${MOCK_HOSTEL.id}`)
        .set('Authorization', AUTH)
        .send(update)

      expect(res.status).toBe(200)
      expect(res.body.name).toBe(update.name)
      expect(res.body.id).toBe(MOCK_HOSTEL.id)
    })

    it('returns 404 for unknown hostel id', async () => {
      const res = await request(app)
        .put('/api/hostels/no-such-hostel')
        .set('Authorization', AUTH)
        .send({ name: 'X' })

      expect(res.status).toBe(404)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).put(`/api/hostels/${MOCK_HOSTEL.id}`).send({ name: 'X' })

      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/hostels/:id ─────────────────────────────────────────────

  describe('DELETE /api/hostels/:id', () => {
    it('deletes a hostel and returns 204', async () => {
      const res = await request(app)
        .delete(`/api/hostels/${MOCK_HOSTEL.id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 404 for unknown hostel id', async () => {
      const res = await request(app)
        .delete('/api/hostels/no-such-hostel')
        .set('Authorization', AUTH)

      expect(res.status).toBe(404)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/api/hostels/${MOCK_HOSTEL.id}`)

      expect(res.status).toBe(401)
    })
  })
})
