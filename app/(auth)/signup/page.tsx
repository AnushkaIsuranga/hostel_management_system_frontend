import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="text-sm text-gray-600">
          Account creation isn’t wired up yet in this frontend (the current backend contract only
          exposes login/refresh/logout).
        </p>
      </div>

      <div className="surface-card border-var p-4 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">What you can do now</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Sign in with an existing account</li>
          <li>Ask an admin to create a user for you</li>
        </ul>
      </div>

      <Link
        href="/login"
        className="accent-btn inline-flex items-center justify-center px-4 py-3 font-semibold"
      >
        Go to Login
      </Link>
    </div>
  )
}
