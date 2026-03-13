import request from 'supertest'
import {
  createApp,
  MOCK_HOSTEL,
  MOCK_VERIFICATION_REQUEST,
  MOCK_SUBSCRIPTION,
  MOCK_HOSTEL_IMAGE,
} from './setup/mockServer'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Hostel Verification, Subscription & Images integration', () => {
  // ── POST /api/hostels/:id/verification/request ──────────────────────────

  describe('POST /api/hostels/:hostelId/verification/request', () => {
    it('submits a verification request and returns 204', async () => {
      const res = await request(app)
        .post(`/api/hostels/${MOCK_HOSTEL.id}/verification/request`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post(`/api/hostels/${MOCK_HOSTEL.id}/verification/request`)

      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/hostels/:id/verification/requests ──────────────────────────

  describe('GET /api/hostels/:hostelId/verification/requests', () => {
    it('returns list of verification requests for a known hostel', async () => {
      const res = await request(app)
        .get(`/api/hostels/${MOCK_HOSTEL.id}/verification/requests`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each verification request has the expected shape', async () => {
      const res = await request(app)
        .get(`/api/hostels/${MOCK_HOSTEL.id}/verification/requests`)
        .set('Authorization', AUTH)

      const vreq = res.body[0]
      expect(vreq).toMatchObject({
        id: MOCK_VERIFICATION_REQUEST.id,
        hostelId: MOCK_HOSTEL.id,
        status: expect.any(Number),
        createdAt: expect.any(String),
      })
    })

    it('returns empty array for unknown hostel', async () => {
      const res = await request(app)
        .get('/api/hostels/ghost-hostel/verification/requests')
        .set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/verification/requests`)

      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/hostels/:id/subscription ───────────────────────────────────

  describe('GET /api/hostels/:hostelId/subscription', () => {
    it('returns subscription details', async () => {
      const res = await request(app)
        .get(`/api/hostels/${MOCK_HOSTEL.id}/subscription`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        hostelId: MOCK_HOSTEL.id,
        isActive: expect.any(Boolean),
        expiresAt: expect.any(String),
      })
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/subscription`)

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/hostels/:id/subscription ───────────────────────────────────

  describe('PUT /api/hostels/:hostelId/subscription', () => {
    it('updates subscription and returns 200', async () => {
      const update = { isActive: false, expiresAt: '2024-12-31T23:59:59Z' }

      const res = await request(app)
        .put(`/api/hostels/${MOCK_HOSTEL.id}/subscription`)
        .set('Authorization', AUTH)
        .send(update)

      expect(res.status).toBe(200)
      expect(res.body.isActive).toBe(false)
      expect(res.body.hostelId).toBe(MOCK_SUBSCRIPTION.hostelId)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/hostels/${MOCK_HOSTEL.id}/subscription`)
        .send({ isActive: true })

      expect(res.status).toBe(401)
    })
  })

  // ── Verification requests admin actions ──────────────────────────────────

  describe('POST /api/verification-requests/:requestId/approve', () => {
    it('approves a request and returns 204', async () => {
      const res = await request(app)
        .post(`/api/verification-requests/${MOCK_VERIFICATION_REQUEST.id}/approve`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post(
        `/api/verification-requests/${MOCK_VERIFICATION_REQUEST.id}/approve`,
      )

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/verification-requests/:requestId/reject', () => {
    it('rejects a request and returns 204', async () => {
      const res = await request(app)
        .post(`/api/verification-requests/${MOCK_VERIFICATION_REQUEST.id}/reject`)
        .set('Authorization', AUTH)
        .send({ adminNotes: 'Insufficient documentation' })

      expect(res.status).toBe(204)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post(
        `/api/verification-requests/${MOCK_VERIFICATION_REQUEST.id}/reject`,
      )

      expect(res.status).toBe(401)
    })
  })

  // ── Hostel images ─────────────────────────────────────────────────────────

  describe('GET /api/hostelimages/:hostelId', () => {
    it('returns images for a known hostel', async () => {
      const res = await request(app).get(`/api/hostelimages/${MOCK_HOSTEL.id}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each image has the expected shape', async () => {
      const res = await request(app).get(`/api/hostelimages/${MOCK_HOSTEL.id}`)

      const img = res.body[0]
      expect(img).toMatchObject({
        id: expect.any(String),
        hostelId: MOCK_HOSTEL.id,
        imageUrl: expect.any(String),
        displayOrder: expect.any(Number),
      })
    })

    it('returns empty array for unknown hostel', async () => {
      const res = await request(app).get('/api/hostelimages/unknown-hostel')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('POST /api/hostelimages/:hostelId', () => {
    it('uploads an image and returns 201', async () => {
      const res = await request(app)
        .post(`/api/hostelimages/${MOCK_HOSTEL.id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: MOCK_HOSTEL_IMAGE.id,
        hostelId: MOCK_HOSTEL.id,
      })
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post(`/api/hostelimages/${MOCK_HOSTEL.id}`)

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/hostelimages/:imageId/order', () => {
    it('updates image order and returns 204', async () => {
      const res = await request(app)
        .put(`/api/hostelimages/${MOCK_HOSTEL_IMAGE.id}/order`)
        .set('Authorization', AUTH)
        .send({ displayOrder: 2 })

      expect(res.status).toBe(204)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/hostelimages/${MOCK_HOSTEL_IMAGE.id}/order`)
        .send({ displayOrder: 1 })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/hostelimages/:imageId', () => {
    it('deletes an image and returns 204', async () => {
      const res = await request(app)
        .delete(`/api/hostelimages/${MOCK_HOSTEL_IMAGE.id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/api/hostelimages/${MOCK_HOSTEL_IMAGE.id}`)

      expect(res.status).toBe(401)
    })
  })
})
