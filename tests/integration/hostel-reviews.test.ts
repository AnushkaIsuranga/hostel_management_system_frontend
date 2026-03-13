import request from 'supertest'
import { createApp, MOCK_HOSTEL, MOCK_REVIEW, MOCK_REVIEW_SUMMARY } from './setup/mockServer'

const app = createApp()
const AUTH = 'Bearer mock-token'

describe('Hostel Reviews API integration', () => {
  // ── GET /api/hostels/:id/reviews ────────────────────────────────────────

  describe('GET /api/hostels/:hostelId/reviews', () => {
    it('returns an array of reviews for a known hostel', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each review has the expected shape', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)

      for (const r of res.body) {
        expect(r).toMatchObject({
          id: expect.any(String),
          hostelId: MOCK_HOSTEL.id,
          userId: expect.any(String),
          rating: expect.any(Number),
          createdAt: expect.any(String),
        })
      }
    })

    it('returns empty array for unknown hostel (not 404)', async () => {
      const res = await request(app).get('/api/hostels/no-such-hostel/reviews')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('is a public route (no auth required)', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)

      expect(res.status).not.toBe(401)
    })
  })

  // ── GET /api/hostels/:id/reviews/summary ────────────────────────────────

  describe('GET /api/hostels/:hostelId/reviews/summary', () => {
    it('returns review summary for a known hostel', async () => {
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/reviews/summary`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        averageRating: MOCK_REVIEW_SUMMARY.averageRating,
        reviewCount: MOCK_REVIEW_SUMMARY.reviewCount,
      })
    })

    it('returns 404 for unknown hostel', async () => {
      const res = await request(app).get('/api/hostels/ghost-hostel/reviews/summary')

      expect(res.status).toBe(404)
    })

    it('is NOT routed to /reviews endpoint', async () => {
      // Route ordering test: /summary must resolve before generic /reviews route
      const res = await request(app).get(`/api/hostels/${MOCK_HOSTEL.id}/reviews/summary`)

      expect(res.body).toHaveProperty('averageRating')
      expect(Array.isArray(res.body)).toBe(false)
    })
  })

  // ── POST /api/hostels/:id/reviews ───────────────────────────────────────

  describe('POST /api/hostels/:hostelId/reviews', () => {
    it('creates a review and returns 201', async () => {
      const res = await request(app)
        .post(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)
        .set('Authorization', AUTH)
        .send({ rating: 5, comment: 'Excellent!' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        rating: 5,
        comment: 'Excellent!',
      })
    })

    it('returns 400 when rating is absent', async () => {
      const res = await request(app)
        .post(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)
        .set('Authorization', AUTH)
        .send({ comment: 'No rating here' })

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('rating')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post(`/api/hostels/${MOCK_HOSTEL.id}/reviews`)
        .send({ rating: 3 })

      expect(res.status).toBe(401)
    })
  })

  // ── PUT /api/hostels/:hostelId/reviews/:reviewId ────────────────────────

  describe('PUT /api/hostels/:hostelId/reviews/:reviewId', () => {
    it('updates a review and returns 200 with merged data', async () => {
      const update = { rating: 3, comment: 'Changed my mind' }

      const res = await request(app)
        .put(`/api/hostels/${MOCK_HOSTEL.id}/reviews/${MOCK_REVIEW.id}`)
        .set('Authorization', AUTH)
        .send(update)

      expect(res.status).toBe(200)
      expect(res.body.rating).toBe(update.rating)
      expect(res.body.comment).toBe(update.comment)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/hostels/${MOCK_HOSTEL.id}/reviews/${MOCK_REVIEW.id}`)
        .send({ rating: 1 })

      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/hostels/:hostelId/reviews/:reviewId ─────────────────────

  describe('DELETE /api/hostels/:hostelId/reviews/:reviewId', () => {
    it('deletes a review and returns 204', async () => {
      const res = await request(app)
        .delete(`/api/hostels/${MOCK_HOSTEL.id}/reviews/${MOCK_REVIEW.id}`)
        .set('Authorization', AUTH)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(
        `/api/hostels/${MOCK_HOSTEL.id}/reviews/${MOCK_REVIEW.id}`,
      )

      expect(res.status).toBe(401)
    })
  })
})
