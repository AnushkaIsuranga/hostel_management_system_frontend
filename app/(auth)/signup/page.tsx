'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight } from 'lucide-react'

import { AuthApi } from '@/lib/backendApi'
import { setAuthSession } from '@/lib/auth'
import { ApiUserRole } from '@/types/backend'
import AccountFields from '@/components/auth/AccountFields'

function isAdminRole(role: ApiUserRole | 'Student' | 'Owner' | 'Admin'): boolean {
  return role === ApiUserRole.Admin || role === 'Admin'
}

const PHONE_REGEX = /^\+?[0-9\s()-]{10,20}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UPPERCASE_REGEX = /[A-Z]/
const LOWERCASE_REGEX = /[a-z]/
const DIGIT_REGEX = /\d/
const SPECIAL_REGEX = /[^A-Za-z0-9]/

export default function SignupPage() {
  const router = useRouter()

  const [selectedRole, setSelectedRole] = useState<ApiUserRole>(ApiUserRole.Student)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid = useMemo(() => {
    if (!email) return true
    return EMAIL_REGEX.test(email.trim())
  }, [email])

  const normalizedPhone = useMemo(() => phoneNumber.replace(/[\s()-]/g, ''), [phoneNumber])

  const isPhoneValid = useMemo(() => {
    if (!phoneNumber) return true
    if (!PHONE_REGEX.test(phoneNumber.trim())) return false
    const digitsOnly = normalizedPhone.replace(/^\+/, '')
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }, [phoneNumber, normalizedPhone])

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasUpper: UPPERCASE_REGEX.test(password),
      hasLower: LOWERCASE_REGEX.test(password),
      hasDigit: DIGIT_REGEX.test(password),
      hasSpecial: SPECIAL_REGEX.test(password),
    }),
    [password],
  )

  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasDigit &&
    passwordChecks.hasSpecial

  const isFullNameProvided = fullName.trim().length > 0
  const isEmailProvided = useMemo(() => email.trim().length > 0, [email])
  const isPhoneProvided = useMemo(() => phoneNumber.trim().length > 0, [phoneNumber])
  const isConfirmPasswordProvided = useMemo(() => confirmPassword.length > 0, [confirmPassword])

  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true
    return password === confirmPassword
  }, [password, confirmPassword])

  const isAccountStepValid =
    isFullNameProvided &&
    isEmailProvided &&
    isPhoneProvided &&
    isConfirmPasswordProvided &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordStrong &&
    passwordsMatch

  function handleRoleChange(role: ApiUserRole) {
    setSelectedRole(role)
  }

  function validateAccountStep() {
    if (!fullName.trim()) return 'Enter your full name.'
    if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address.'
    if (!PHONE_REGEX.test(phoneNumber.trim())) return 'Enter a valid phone number.'
    if (!isPasswordStrong) {
      return 'Password must include uppercase, lowercase, number and symbol.'
    }
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  function goToOnboarding() {
    const validationError = validateAccountStep()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    // persist partial account info in sessionStorage for onboarding to pick up
    try {
      const partial = {
        selectedRole,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      }
      sessionStorage.setItem('signup_partial', JSON.stringify(partial))
    } catch {
      // ignore storage errors
    }

    router.push('/signup/onboarding')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    setSubmitting(true)

    try {
      const tokens = await AuthApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        role: selectedRole,
      })

      setAuthSession(tokens)

      const next =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null
      if (next && next.startsWith('/')) {
        router.replace(next)
        return
      }

      if (isAdminRole(tokens.role)) {
        router.replace('/admin')
        return
      }

      router.replace('/hostels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const accountDetailsFields = (
    <AccountFields
      selectedRole={selectedRole}
      fullName={fullName}
      email={email}
      phoneNumber={phoneNumber}
      password={password}
      confirmPassword={confirmPassword}
      submitting={submitting}
      isEmailValid={isEmailValid}
      isPhoneValid={isPhoneValid}
      isPasswordStrong={isPasswordStrong}
      onRoleChange={handleRoleChange}
      onFullNameChange={setFullName}
      onEmailChange={setEmail}
      onPhoneNumberChange={setPhoneNumber}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
    />
  )

  // preload any partial signup info saved by onboarding flow
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('signup_partial')
      if (!raw) return
      const partial = JSON.parse(raw)
      if (partial.fullName) setFullName(partial.fullName)
      if (partial.email) setEmail(partial.email)
      if (partial.phoneNumber) setPhoneNumber(partial.phoneNumber)
      if (partial.password) setPassword(partial.password)
      if (partial.selectedRole) setSelectedRole(partial.selectedRole)
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-md space-y-7 px-4 py-6 sm:px-0 lg:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
        <p className="text-sm text-gray-600">Join us and find your perfect accommodation.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Sign up failed</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-5">{accountDetailsFields}</div>

        {!passwordsMatch && password && confirmPassword && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-700">Passwords do not match</p>
          </div>
        )}

        {selectedRole === ApiUserRole.Student ? (
          <button
            type="button"
            onClick={goToOnboarding}
            disabled={submitting || !isAccountStepValid}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting || !isAccountStepValid}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        )}
      </form>

      <div className="pt-2 text-center text-sm text-gray-600">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-amber-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
