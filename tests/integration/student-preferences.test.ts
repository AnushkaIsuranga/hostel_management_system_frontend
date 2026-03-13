import request from 'supertest'
import { createApp, MOCK_STUDENT_PREFERENCE } from './setup/mockServer'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Student Preferences API integration', () => {
  // ── GET /api/student-preferences/me ────────────────────────────────────

  describe('GET /api/student-preferences/me', () => {
    it("returns the authenticated student's preferences", async () => {
      const res = await request(app).get('/api/student-preferences/me').set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        userId: MOCK_STUDENT_PREFERENCE.userId,
        universityId: MOCK_STUDENT_PREFERENCE.universityId,
        minBudget: expect.any(Number),
        maxBudget: expect.any(Number),
      })
    })

    it('includes priorityOrder and weights in the response', async () => {
      const res = await request(app).get('/api/student-preferences/me').set('Authorization', AUTH)

      expect(res.body).toHaveProperty('priorityOrder')
      expect(res.body).toHaveProperty('weights')
      expect(Array.isArray(res.body.priorityOrder)).toBe(true)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/student-preferences/me')

      expect(res.status).toBe(401)
      expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' })
    })

    it('returns 401 with a malformed auth header', async () => {
      const res = await request(app)
        .get('/api/student-preferences/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz')

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/student-preferences/me ────────────────────────────────────

  describe('PUT /api/student-preferences/me', () => {
    const validPayload = {
      universityId: 'university-1',
      minBudget: 5000,
      maxBudget: 20000,
      requiredCapacity: 2,
      selectedAmenities: ['WiFi', 'AC'],
      priorityOrder: ['rating', 'price', 'distance'],
      weights: { rating: 0.5, price: 0.3, distance: 0.2 },
    }

    it('updates preferences and returns 200 with merged data', async () => {
      const res = await request(app)
        .put('/api/student-preferences/me')
        .set('Authorization', AUTH)
        .send(validPayload)

      expect(res.status).toBe(200)
      expect(res.body.universityId).toBe(validPayload.universityId)
      expect(res.body.minBudget).toBe(validPayload.minBudget)
      expect(res.body.maxBudget).toBe(validPayload.maxBudget)
    })

    it('returns the userId from the fixture in the response', async () => {
      const res = await request(app)
        .put('/api/student-preferences/me')
        .set('Authorization', AUTH)
        .send(validPayload)

      expect(res.body.userId).toBe(MOCK_STUDENT_PREFERENCE.userId)
    })

    it('returns 400 when universityId is absent', async () => {
      const { universityId: _omit, ...partial } = validPayload

      const res = await request(app)
        .put('/api/student-preferences/me')
        .set('Authorization', AUTH)
        .send(partial)

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('universityId')
    })

    it('returns 400 for an empty body', async () => {
      const res = await request(app)
        .put('/api/student-preferences/me')
        .set('Authorization', AUTH)
        .send({})

      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).put('/api/student-preferences/me').send(validPayload)

      expect(res.status).toBe(401)
    })
  })
})
