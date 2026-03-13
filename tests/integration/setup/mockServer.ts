import express from 'express'
import type { Express, Request, Response, NextFunction } from 'express'
import {
  ApiHostelStatus,
  ApiHostelVerificationStatus,
  ApiInteractionType,
  ApiUserRole,
} from '../../../types/backend'

// ─── Fixtures ──────────────────────────────────────────────────────────────

export const MOCK_TOKENS = {
  accessToken: 'mock-access-token',
  accessTokenExpiresAt: '2099-01-01T00:00:00Z',
  userId: 'user-student-1',
  email: 'student@example.com',
  role: ApiUserRole.Student,
}

export const MOCK_USERS = [
  {
    id: 'user-student-1',
    fullName: 'Alice Student',
    email: 'student@example.com',
    phoneNumber: '+94711111111',
    role: ApiUserRole.Student,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'user-owner-1',
    fullName: 'Bob Owner',
    email: 'owner@example.com',
    phoneNumber: '+94722222222',
    role: ApiUserRole.Owner,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'user-admin-1',
    fullName: 'Carol Admin',
    email: 'admin@example.com',
    phoneNumber: '+94733333333',
    role: ApiUserRole.Admin,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
  },
]

export const MOCK_STATS = {
  hostels: { totalCount: 10, last7DaysCount: 2 },
  users: { totalCount: 50, last7DaysCount: 5 },
  reviews: { totalCount: 120, last7DaysCount: 10 },
}

export const MOCK_HOSTEL = {
  id: 'hostel-1',
  name: 'Sunrise Hostel',
  description: 'Great hostel near campus',
  city: 'Colombo',
  address: '123 Main Street',
  ownerId: 'user-owner-1',
  isVerified: true,
  verifiedAt: '2025-03-01T00:00:00Z',
  verifiedByAdminId: 'user-admin-1',
  verificationStatus: ApiHostelVerificationStatus.Approved,
  latitude: 6.9271,
  longitude: 79.8612,
  googleMapsUrl: 'https://maps.google.com/?q=6.9271,79.8612',
  minPrice: 10000,
  maxPrice: 15000,
  genderPolicy: 'Mixed',
  images: [],
  status: ApiHostelStatus.Active,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: null,
}

export const MOCK_AMENITY = { id: 'amenity-1', name: 'WiFi' }
export const MOCK_AMENITY_2 = { id: 'amenity-2', name: 'AC' }

export const MOCK_UNIVERSITY = {
  id: 'university-1',
  name: 'University of Colombo',
  latitude: 6.9022,
  longitude: 79.861,
}

export const MOCK_REVIEW = {
  id: 'review-1',
  hostelId: 'hostel-1',
  userId: 'user-student-1',
  userFullName: 'Alice Student',
  rating: 4,
  comment: 'Great place to stay',
  createdAt: '2025-02-01T00:00:00Z',
  updatedAt: null,
}

export const MOCK_REVIEW_SUMMARY = { averageRating: 4.0, reviewCount: 1 }

export const MOCK_VERIFICATION_REQUEST = {
  id: 'vreq-1',
  hostelId: 'hostel-1',
  requestedByUserId: 'user-owner-1',
  status: ApiHostelVerificationStatus.Pending,
  adminNotes: null,
  reviewedByAdminId: null,
  reviewedAt: null,
  createdAt: '2025-03-01T00:00:00Z',
  updatedAt: null,
}

export const MOCK_SUBSCRIPTION = {
  hostelId: 'hostel-1',
  isActive: true,
  expiresAt: '2026-01-01T00:00:00Z',
}

export const MOCK_HOSTEL_AMENITY = { hostelId: 'hostel-1', amenityId: 'amenity-1' }

export const MOCK_HOSTEL_IMAGE = {
  id: 'image-1',
  hostelId: 'hostel-1',
  fileName: 'room.jpg',
  imageUrl: '/uploads/room.jpg',
  displayOrder: 0,
}

export const MOCK_STUDENT_PREFERENCE = {
  userId: 'user-student-1',
  universityId: 'university-1',
  minBudget: 8000,
  maxBudget: 15000,
  requiredCapacity: 1,
  selectedAmenities: ['WiFi'],
  priorityOrder: ['price', 'distance', 'rating'],
  weights: { price: 0.5, distance: 0.3, rating: 0.2 },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: null,
}

export const MOCK_EVENT = {
  id: 'event-1',
  userId: 'user-student-1',
  hostelId: 'hostel-1',
  eventType: ApiInteractionType.ViewHostel,
  sessionId: 'session-1',
  metadata: { source: 'hostel-details' },
  createdAt: '2025-02-01T00:00:00Z',
}

// ─── Auth middleware ────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ status: 401, title: 'Unauthorized', detail: 'Missing bearer token' })
    return
  }
  next()
}

// ─── App factory ───────────────────────────────────────────────────────────

export function createApp(): Express {
  const app = express()
  app.use(express.json())

  // ── Auth ─────────────────────────────────────────────────────────────────

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {}
    if (!email || !password) {
      res
        .status(400)
        .json({ status: 400, title: 'Bad Request', detail: 'Email and password are required' })
      return
    }
    if (password === 'wrong-password') {
      res.status(401).json({ status: 401, title: 'Unauthorized', detail: 'Invalid credentials' })
      return
    }
    res.json({ ...MOCK_TOKENS, email })
  })

  app.post('/api/auth/register', (req, res) => {
    const { email, password, fullName, phoneNumber } = req.body ?? {}
    if (!email || !password || !fullName || !phoneNumber) {
      res.status(400).json({ status: 400, title: 'Bad Request', detail: 'All fields are required' })
      return
    }
    res.status(201).json({ ...MOCK_TOKENS, email })
  })

  app.post('/api/auth/refresh', (_req, res) => {
    res.json(MOCK_TOKENS)
  })

  app.post('/api/auth/logout', (_req, res) => {
    res.status(204).send()
  })

  // ── Users — specific paths BEFORE parameterized /:id ─────────────────────

  app.get('/api/users/stats', requireAuth, (_req, res) => {
    res.json(MOCK_STATS)
  })

  app.get('/api/users/role/:role', requireAuth, (req, res) => {
    const raw = decodeURIComponent(req.params.role)
    const roleNum = Number(raw)
    const filtered = MOCK_USERS.filter((u) =>
      Number.isFinite(roleNum)
        ? u.role === roleNum
        : raw.toLowerCase() === 'owner'
          ? u.role === ApiUserRole.Owner
          : raw.toLowerCase() === 'student'
            ? u.role === ApiUserRole.Student
            : raw.toLowerCase() === 'admin'
              ? u.role === ApiUserRole.Admin
              : false,
    )
    res.json(filtered)
  })

  app.get('/api/users', requireAuth, (_req, res) => {
    res.json(MOCK_USERS)
  })

  app.get('/api/users/:id', requireAuth, (req, res) => {
    const user = MOCK_USERS.find((u) => u.id === req.params.id)
    if (!user) {
      res
        .status(404)
        .json({ status: 404, title: 'Not Found', detail: `User ${req.params.id} not found` })
      return
    }
    res.json(user)
  })

  app.post('/api/users', requireAuth, (req, res) => {
    const { fullName, email, phoneNumber, role } = req.body ?? {}
    if (!fullName || !email || !phoneNumber || role === undefined) {
      res
        .status(400)
        .json({
          status: 400,
          title: 'Bad Request',
          detail: 'fullName, email, phoneNumber and role are required',
        })
      return
    }
    res
      .status(201)
      .json({
        id: 'user-new-1',
        fullName,
        email,
        phoneNumber,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      })
  })

  app.put('/api/users/:id', requireAuth, (req, res) => {
    const { fullName, phoneNumber, role } = req.body ?? {}
    if (!fullName || !phoneNumber || role === undefined) {
      res
        .status(400)
        .json({
          status: 400,
          title: 'Bad Request',
          detail: 'fullName, phoneNumber and role are required',
        })
      return
    }
    const user = MOCK_USERS.find((u) => u.id === req.params.id)
    if (!user) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json({ ...user, fullName, phoneNumber, role })
  })

  app.delete('/api/users/:id', requireAuth, (req, res) => {
    const user = MOCK_USERS.find((u) => u.id === req.params.id)
    if (!user) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.status(204).send()
  })

  // ── Hostels — nested routes before /:id ──────────────────────────────────

  app.get('/api/hostels', (_req, res) => {
    res.json([MOCK_HOSTEL])
  })

  app.post('/api/hostels/search', (req, res) => {
    res.json([{ hostel: MOCK_HOSTEL, distanceKm: 1.5, score: 0.8 }])
  })

  app.post('/api/hostels', requireAuth, (req, res) => {
    const { name, city, address } = req.body ?? {}
    if (!name || !city || !address) {
      res
        .status(400)
        .json({ status: 400, title: 'Bad Request', detail: 'name, city and address are required' })
      return
    }
    res.status(201).json({ ...MOCK_HOSTEL, id: 'hostel-new-1', ...req.body })
  })

  // Reviews — summary before list to avoid ambiguity

  app.get('/api/hostels/:hostelId/reviews/summary', (req, res) => {
    if (req.params.hostelId !== MOCK_HOSTEL.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json(MOCK_REVIEW_SUMMARY)
  })

  app.get('/api/hostels/:hostelId/reviews', (req, res) => {
    if (req.params.hostelId !== MOCK_HOSTEL.id) {
      res.json([])
      return
    }
    res.json([MOCK_REVIEW])
  })

  app.post('/api/hostels/:hostelId/reviews', requireAuth, (req, res) => {
    const { rating } = req.body ?? {}
    if (!rating) {
      res.status(400).json({ status: 400, title: 'Bad Request', detail: 'rating is required' })
      return
    }
    res.status(201).json({ ...MOCK_REVIEW, ...req.body })
  })

  app.put('/api/hostels/:hostelId/reviews/:reviewId', requireAuth, (req, res) => {
    res.json({ ...MOCK_REVIEW, ...req.body })
  })

  app.delete('/api/hostels/:hostelId/reviews/:reviewId', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  // Verification

  app.post('/api/hostels/:hostelId/verification/request', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  app.get('/api/hostels/:hostelId/verification/requests', requireAuth, (req, res) => {
    if (req.params.hostelId !== MOCK_HOSTEL.id) {
      res.json([])
      return
    }
    res.json([MOCK_VERIFICATION_REQUEST])
  })

  // Subscription

  app.get('/api/hostels/:hostelId/subscription', requireAuth, (_req, res) => {
    res.json(MOCK_SUBSCRIPTION)
  })

  app.put('/api/hostels/:hostelId/subscription', requireAuth, (req, res) => {
    res.json({ ...MOCK_SUBSCRIPTION, ...req.body })
  })

  // Hostel CRUD — parameterized last

  app.get('/api/hostels/:id', (req, res) => {
    if (req.params.id !== MOCK_HOSTEL.id) {
      res
        .status(404)
        .json({ status: 404, title: 'Not Found', detail: `Hostel ${req.params.id} not found` })
      return
    }
    res.json(MOCK_HOSTEL)
  })

  app.put('/api/hostels/:id', requireAuth, (req, res) => {
    if (req.params.id !== MOCK_HOSTEL.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json({ ...MOCK_HOSTEL, ...req.body })
  })

  app.delete('/api/hostels/:id', requireAuth, (req, res) => {
    if (req.params.id !== MOCK_HOSTEL.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.status(204).send()
  })

  // ── Verification requests (admin actions) ─────────────────────────────────

  app.post('/api/verification-requests/:requestId/approve', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  app.post('/api/verification-requests/:requestId/reject', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  // ── Amenities ─────────────────────────────────────────────────────────────

  app.get('/api/amenities', (_req, res) => {
    res.json([MOCK_AMENITY, MOCK_AMENITY_2])
  })

  app.post('/api/amenities', requireAuth, (req, res) => {
    const { name } = req.body ?? {}
    if (!name) {
      res.status(400).json({ status: 400, title: 'Bad Request', detail: 'name is required' })
      return
    }
    res.status(201).json({ id: 'amenity-new-1', name })
  })

  // ── Hostel amenities ──────────────────────────────────────────────────────

  app.get('/api/hostel-amenities', (_req, res) => {
    res.json([MOCK_HOSTEL_AMENITY])
  })

  app.post('/api/hostel-amenities', requireAuth, (req, res) => {
    const { hostelId, amenityId } = req.body ?? {}
    if (!hostelId || !amenityId) {
      res
        .status(400)
        .json({ status: 400, title: 'Bad Request', detail: 'hostelId and amenityId are required' })
      return
    }
    res.status(204).send()
  })

  app.delete('/api/hostel-amenities/:hostelId/:amenityId', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  // ── Universities ──────────────────────────────────────────────────────────

  app.get('/api/universities', (_req, res) => {
    res.json([MOCK_UNIVERSITY])
  })

  app.post('/api/universities', requireAuth, (req, res) => {
    const { name } = req.body ?? {}
    if (!name) {
      res.status(400).json({ status: 400, title: 'Bad Request', detail: 'name is required' })
      return
    }
    res.status(201).json({ id: 'university-new-1', ...req.body })
  })

  app.get('/api/universities/:id', (req, res) => {
    if (req.params.id !== MOCK_UNIVERSITY.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json(MOCK_UNIVERSITY)
  })

  app.put('/api/universities/:id', requireAuth, (req, res) => {
    if (req.params.id !== MOCK_UNIVERSITY.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json({ ...MOCK_UNIVERSITY, ...req.body })
  })

  app.delete('/api/universities/:id', requireAuth, (req, res) => {
    if (req.params.id !== MOCK_UNIVERSITY.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.status(204).send()
  })

  // ── Student preferences ───────────────────────────────────────────────────

  app.get('/api/student-preferences/me', requireAuth, (_req, res) => {
    res.json(MOCK_STUDENT_PREFERENCE)
  })

  app.put('/api/student-preferences/me', requireAuth, (req, res) => {
    const { universityId } = req.body ?? {}
    if (!universityId) {
      res
        .status(400)
        .json({ status: 400, title: 'Bad Request', detail: 'universityId is required' })
      return
    }
    res.json({ ...MOCK_STUDENT_PREFERENCE, ...req.body })
  })

  // ── Hostel images ─────────────────────────────────────────────────────────

  app.get('/api/hostelimages/:hostelId', (req, res) => {
    if (req.params.hostelId !== MOCK_HOSTEL.id) {
      res.json([])
      return
    }
    res.json([MOCK_HOSTEL_IMAGE])
  })

  app.post('/api/hostelimages/:hostelId', requireAuth, (_req, res) => {
    res.status(201).json(MOCK_HOSTEL_IMAGE)
  })

  app.put('/api/hostelimages/:imageId/order', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  app.delete('/api/hostelimages/:imageId', requireAuth, (_req, res) => {
    res.status(204).send()
  })

  // ── Interaction events ────────────────────────────────────────────────────

  app.get('/api/interactionevents', (_req, res) => {
    res.json([MOCK_EVENT])
  })

  app.post('/api/interactionevents', (req, res) => {
    const { eventType } = req.body ?? {}
    if (eventType === undefined) {
      res.status(400).json({ status: 400, title: 'Bad Request', detail: 'eventType is required' })
      return
    }
    res.status(201).json({ ...MOCK_EVENT, id: 'event-new-1', ...req.body })
  })

  app.get('/api/interactionevents/:id', (req, res) => {
    if (req.params.id !== MOCK_EVENT.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json(MOCK_EVENT)
  })

  app.put('/api/interactionevents/:id', (req, res) => {
    if (req.params.id !== MOCK_EVENT.id) {
      res.status(404).json({ status: 404, title: 'Not Found' })
      return
    }
    res.json({ ...MOCK_EVENT, ...req.body })
  })

  app.delete('/api/interactionevents/:id', (_req, res) => {
    res.status(204).send()
  })

  return app
}
