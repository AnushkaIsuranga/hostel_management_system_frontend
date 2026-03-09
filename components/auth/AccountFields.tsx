import React from 'react'
import { ApiUserRole } from '@/types/backend'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type AccountFieldsProps = {
  selectedRole: ApiUserRole
  fullName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  submitting: boolean
  isEmailValid: boolean
  isPhoneValid: boolean
  isPasswordStrong: boolean
  onRoleChange: (role: ApiUserRole) => void
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneNumberChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}

export default function AccountFields({
  selectedRole,
  fullName,
  email,
  phoneNumber,
  password,
  confirmPassword,
  submitting,
  isEmailValid,
  isPhoneValid,
  isPasswordStrong,
  onRoleChange,
  onFullNameChange,
  onEmailChange,
  onPhoneNumberChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: AccountFieldsProps) {
  return (
    <>
      <div className="mb-8 flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => onRoleChange(ApiUserRole.Student)}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
            selectedRole === ApiUserRole.Student
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={submitting}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => onRoleChange(ApiUserRole.Owner)}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
            selectedRole === ApiUserRole.Owner
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={submitting}
        >
          Owner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="mb-3 block text-base font-bold text-gray-900">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder="John Doe"
            autoComplete="name"
            required
            disabled={submitting}
          />
        </label>

        <label className="block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Email</span>
            {email.length > 0 && isEmailValid && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-gray-50 ${
              email && !isEmailValid
                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={submitting}
          />
          {email && !isEmailValid && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Please enter a valid email address</span>
            </div>
          )}
        </label>

        <label className="block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Phone number</span>
            {phoneNumber.length > 0 && isPhoneValid && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-gray-50 ${
              phoneNumber && !isPhoneValid
                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
            placeholder="+250 7XX XXX XXX"
            autoComplete="tel"
            required
            disabled={submitting}
          />
          {phoneNumber && !isPhoneValid && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>10-15 digits required</span>
            </div>
          )}
        </label>

        <label className="block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Password</span>
            {password.length > 0 && isPasswordStrong && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-gray-50 ${
              password && !isPasswordStrong
                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }`}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={submitting}
          />
          {password && !isPasswordStrong && (
            <div className="mt-1.5 text-sm text-red-600">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-4 w-4" />
                Password must contain:
              </p>
              <ul className="mt-1 ml-6 list-disc space-y-1 text-xs">
                <li>At least 8 characters</li>
                <li>Uppercase letter</li>
                <li>Lowercase letter</li>
                <li>Number</li>
                <li>Special character</li>
              </ul>
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-3 block text-base font-bold text-gray-900">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={submitting}
          />
        </label>
      </div>
    </>
  )
}
