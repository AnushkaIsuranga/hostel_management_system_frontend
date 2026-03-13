import request from 'supertest'
import { createApp, MOCK_AMENITY, MOCK_HOSTEL_AMENITY } from './setup/mockServer'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Amenities API integration', () => {
  // ── GET /api/amenities ──────────────────────────────────────────────────

  describe('GET /api/amenities', () => {
    it('returns 200 with an array of amenities (public route)', async () => {
      const res = await request(app).get('/api/amenities')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each amenity has id and name', async () => {
      const res = await request(app).get('/api/amenities')

      for (const amenity of res.body) {
        expect(amenity).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
        })
      }
    })

    it('includes the fixture amenity', async () => {
      const res = await request(app).get('/api/amenities')

      const names = res.body.map((a: { name: string }) => a.name)
      expect(names).toContain(MOCK_AMENITY.name)
    })

    it('does NOT require Authorization header', async () => {
      const res = await request(app).get('/api/amenities')

      expect(res.status).not.toBe(401)
    })
  })

  // ── POST /api/amenities ─────────────────────────────────────────────────

  describe('POST /api/amenities', () => {
    it('creates an amenity and returns 201', async () => {
      const res = await request(app)
        .post('/api/amenities')
        .set('Authorization', AUTH)
        .send({ name: 'Swimming Pool' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: 'Swimming Pool',
      })
    })

    it('returns 400 when name is absent', async () => {
      const res = await request(app).post('/api/amenities').set('Authorization', AUTH).send({})

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('name')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/amenities').send({ name: 'Parking' })

      expect(res.status).toBe(401)
    })
  })
})

describe('Hostel Amenities API integration', () => {
  // ── GET /api/hostel-amenities ───────────────────────────────────────────

  describe('GET /api/hostel-amenities', () => {
    it('returns 200 with an array of hostel-amenity pairs (public route)', async () => {
      const res = await request(app).get('/api/hostel-amenities')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('each entry has hostelId and amenityId', async () => {
      const res = await request(app).get('/api/hostel-amenities')

      for (const ha of res.body) {
        expect(ha).toMatchObject({
          hostelId: expect.any(String),
          amenityId: expect.any(String),
        })
      }
    })

    it('includes the fixture hostel-amenity pairing', async () => {
      const res = await request(app).get('/api/hostel-amenities')

      const found = res.body.some(
        (ha: { hostelId: string; amenityId: string }) =>
          ha.hostelId === MOCK_HOSTEL_AMENITY.hostelId &&
          ha.amenityId === MOCK_HOSTEL_AMENITY.amenityId,
      )
      expect(found).toBe(true)
    })
  })

  // ── POST /api/hostel-amenities ──────────────────────────────────────────

  describe('POST /api/hostel-amenities', () => {
    it('adds an amenity to a hostel and returns 204', async () => {
      const res = await request(app)
        .post('/api/hostel-amenities')
        .set('Authorization', AUTH)
        .send({ hostelId: 'hostel-1', amenityId: 'amenity-2' })

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 400 when hostelId is missing', async () => {
      const res = await request(app)
        .post('/api/hostel-amenities')
        .set('Authorization', AUTH)
        .send({ amenityId: 'amenity-1' })

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('hostelId')
    })

    it('returns 400 when amenityId is missing', async () => {
      const res = await request(app)
        .post('/api/hostel-amenities')
        .set('Authorization', AUTH)
        .send({ hostelId: 'hostel-1' })

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/hostel-amenities')
        .send({ hostelId: 'hostel-1', amenityId: 'amenity-1' })

      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/hostel-amenities/:hostelId/:amenityId ───────────────────

  describe('DELETE /api/hostel-amenities/:hostelId/:amenityId', () => {
    it('removes the pairing and returns 204', async () => {
      const res = await request(app)
        .delete(
          `/api/hostel-amenities/${MOCK_HOSTEL_AMENITY.hostelId}/${MOCK_HOSTEL_AMENITY.amenityId}`,
        )
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(
        `/api/hostel-amenities/${MOCK_HOSTEL_AMENITY.hostelId}/${MOCK_HOSTEL_AMENITY.amenityId}`,
      )

      expect(res.status).toBe(401)
    })
  })
})
