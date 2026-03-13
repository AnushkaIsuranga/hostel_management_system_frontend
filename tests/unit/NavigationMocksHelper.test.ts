import { createNextNavigationModule } from '../helpers/navigationMocks'

describe('createNextNavigationModule', () => {
  it('returns the default Next navigation mocks when no overrides are provided', () => {
    const module = createNextNavigationModule()

    expect(module.__esModule).toBe(true)
    expect(module.useRouter()).toEqual({})
    expect(module.usePathname()).toBe('/')
    expect(module.useParams()).toEqual({})
    expect(module.redirect('/target')).toBeUndefined()
  })

  it('uses the provided overrides', () => {
    const useRouter = jest.fn(() => ({ push: jest.fn() }))
    const usePathname = jest.fn(() => '/admin')
    const useParams = jest.fn(() => ({ userId: '123' }))
    const redirect = jest.fn(() => 'redirected')

    const module = createNextNavigationModule({
      useRouter,
      usePathname,
      useParams,
      redirect,
    })

    expect(module.useRouter()).toEqual({ push: expect.any(Function) })
    expect(module.usePathname()).toBe('/admin')
    expect(module.useParams()).toEqual({ userId: '123' })
    expect(module.redirect('/login')).toBe('redirected')
    expect(useRouter).toHaveBeenCalledTimes(1)
    expect(usePathname).toHaveBeenCalledTimes(1)
    expect(useParams).toHaveBeenCalledTimes(1)
    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
