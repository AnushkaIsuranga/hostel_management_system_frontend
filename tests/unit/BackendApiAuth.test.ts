import { AuthApi, UsersApi } from '../../lib/backendApi'

function jsonResponse(body: unknown, status: number) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

describe('backendApi auth header handling', () => {
  const fetchMock = jest.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as typeof fetch
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('does not send Authorization when registering while a session exists', async () => {
    window.localStorage.setItem('hms_access_token', 'existing-token')

    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          accessToken: 'new-token',
          accessTokenExpiresAt: '2099-01-01T00:00:00Z',
          userId: 'owner-1',
          email: 'owner@example.com',
          role: 1,
        },
        201,
      ) as Response,
    )

    await AuthApi.register({
      fullName: 'Owner User',
      email: 'owner@example.com',
      phoneNumber: '+94771234567',
      password: 'Strong1!',
      role: 1,
    })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBeNull()
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    expect(body?.role).toBe('Owner')
  })

  it('still sends Authorization for protected endpoints', async () => {
    window.localStorage.setItem('hms_access_token', 'existing-token')

    fetchMock.mockResolvedValue(jsonResponse([], 200) as Response)

    await UsersApi.list()

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer existing-token')
  })
})
