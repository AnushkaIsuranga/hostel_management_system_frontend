import request from 'supertest'
import { createApp, MOCK_EVENT } from './setup/mockServer'
import { ApiInteractionType } from '../../types/backend'

const app = createApp()

describe('Interaction Events API integration', () => {
  // ── GET /api/interactionevents ──────────────────────────────────────────

  describe('GET /api/interactionevents', () => {
    it('returns 200 with an array of events (public route)', async () => {
      const res = await request(app).get('/api/interactionevents')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('each event has the expected shape', async () => {
      const res = await request(app).get('/api/interactionevents')

      for (const ev of res.body) {
        expect(ev).toMatchObject({
          id: expect.any(String),
          hostelId: expect.any(String),
          eventType: expect.any(Number),
          createdAt: expect.any(String),
        })
      }
    })

    it('does NOT require Authorization header', async () => {
      const res = await request(app).get('/api/interactionevents')

      expect(res.status).not.toBe(401)
    })
  })

  // ── GET /api/interactionevents/:id ──────────────────────────────────────

  describe('GET /api/interactionevents/:id', () => {
    it('returns a single event by id', async () => {
      const res = await request(app).get(`/api/interactionevents/${MOCK_EVENT.id}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        id: MOCK_EVENT.id,
        hostelId: MOCK_EVENT.hostelId,
        eventType: MOCK_EVENT.eventType,
      })
    })

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/interactionevents/no-such-event')

      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ status: 404, title: 'Not Found' })
    })
  })

  // ── POST /api/interactionevents ─────────────────────────────────────────

  describe('POST /api/interactionevents', () => {
    const validPayload = {
      userId: 'user-student-1',
      hostelId: 'hostel-1',
      eventType: ApiInteractionType.ViewHostel,
      sessionId: 'session-abc',
      metadata: { source: 'search-results' },
    }

    it('records an event and returns 201', async () => {
      const res = await request(app).post('/api/interactionevents').send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: expect.any(String),
        eventType: validPayload.eventType,
        hostelId: validPayload.hostelId,
      })
    })

    it('is a public route (no auth required)', async () => {
      const res = await request(app).post('/api/interactionevents').send(validPayload)

      expect(res.status).not.toBe(401)
    })

    it('returns 400 when eventType is absent', async () => {
      const { eventType: _omit, ...partial } = validPayload

      const res = await request(app).post('/api/interactionevents').send(partial)

      expect(res.status).toBe(400)
      expect(res.body.detail).toContain('eventType')
    })

    it('returns 400 for an empty body', async () => {
      const res = await request(app).post('/api/interactionevents').send({})

      expect(res.status).toBe(400)
    })

    it('assigns a new id different from the fixture', async () => {
      const res = await request(app).post('/api/interactionevents').send(validPayload)

      expect(res.body.id).not.toBe(MOCK_EVENT.id)
    })
  })

  // ── PUT /api/interactionevents/:id ──────────────────────────────────────

  describe('PUT /api/interactionevents/:id', () => {
    it('updates an event and returns 200 with merged data', async () => {
      const update = { metadata: { source: 'updated-source' } }

      const res = await request(app).put(`/api/interactionevents/${MOCK_EVENT.id}`).send(update)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(MOCK_EVENT.id)
      expect(res.body.metadata).toMatchObject(update.metadata)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .put('/api/interactionevents/no-such-event')
        .send({ metadata: {} })

      expect(res.status).toBe(404)
    })
  })

  // ── DELETE /api/interactionevents/:id ───────────────────────────────────

  describe('DELETE /api/interactionevents/:id', () => {
    it('deletes an event and returns 204', async () => {
      const res = await request(app).delete(`/api/interactionevents/${MOCK_EVENT.id}`)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
    })

    it('the route is public (no auth required)', async () => {
      const res = await request(app).delete(`/api/interactionevents/${MOCK_EVENT.id}`)

      expect(res.status).not.toBe(401)
    })
  })
})
