type NextNavigationMockOptions = {
  useRouter?: () => unknown
  usePathname?: () => string
  useParams?: () => unknown
  redirect?: (...args: any[]) => unknown
}

export function createNextNavigationModule(options: NextNavigationMockOptions = {}) {
  return {
    __esModule: true,
    useRouter: options.useRouter ?? (() => ({})),
    usePathname: options.usePathname ?? (() => '/'),
    useParams: options.useParams ?? (() => ({})),
    redirect: options.redirect ?? (() => undefined),
  }
}

