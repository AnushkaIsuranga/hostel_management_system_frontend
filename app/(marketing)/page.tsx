'use client'

import React from 'react'
import AnimatedElement from '@/lib/animations/AnimatedElement'
import { ParallaxElement } from '@/lib/animations/ParallaxElement'

import {
  FaBolt,
  FaCamera,
  FaFacebookF,
  FaHeart,
  FaHome,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaRegHandshake,
  FaShieldAlt,
  FaStar,
  FaTags,
} from 'react-icons/fa'
import { FiArrowRight, FiMail } from 'react-icons/fi'

import type { Feature, Stat, Testimonial } from '../../types'

export default function Page() {
  const universities: string[] = [
    'University of Colombo',
    'University of Peradeniya',
    'University of Moratuwa',
    'University of Kelaniya',
    'University of Sri Jayewardenepura',
    'University of Ruhuna',
  ]

  const features: Feature[] = [
    {
      icon: <FaShieldAlt className="text-amber-700" aria-hidden="true" />,
      title: 'Verified Hostels',
      description:
        'All hostels are personally verified for safety, cleanliness, and student-friendly amenities',
    },
    {
      icon: <FaTags className="text-amber-700" aria-hidden="true" />,
      title: 'Transparent Pricing',
      description:
        'No hidden fees. See exact monthly costs including utilities and deposits upfront',
    },
    {
      icon: <FaMapMarkerAlt className="text-amber-700" aria-hidden="true" />,
      title: 'Location-Based Search',
      description: 'Find hostels near your university campus with distance and commute information',
    },
    {
      icon: <FaRegHandshake className="text-amber-700" aria-hidden="true" />,
      title: 'Direct Contact',
      description:
        'Connect directly with hostel owners and current residents for authentic reviews',
    },
    {
      icon: <FaCamera className="text-amber-700" aria-hidden="true" />,
      title: 'Real Photos & Tours',
      description: 'Browse actual photos and virtual tours of rooms, common areas, and facilities',
    },
    {
      icon: <FaBolt className="text-amber-700" aria-hidden="true" />,
      title: 'Instant Booking',
      description:
        'Reserve your room online and secure your accommodation before the semester starts',
    },
  ]

  const testimonials: Testimonial[] = [
    {
      name: 'Sanduni Perera',
      university: 'University of Colombo',
      text: 'Finding a safe hostel near campus was so stressful until I found this platform. Booked my room in just 10 minutes!',
      avatar: 'SP',
    },
    {
      name: 'Kasun Rajapaksa',
      university: 'University of Moratuwa',
      text: 'The verified listings gave me confidence. I could see real photos and read reviews from actual students living there.',
      avatar: 'KR',
    },
    {
      name: 'Dilini Fernando',
      university: 'University of Peradeniya',
      text: 'Transparent pricing was a game-changer. No surprises, no hidden costs. Exactly what students need.',
      avatar: 'DF',
    },
  ]

  const stats: Stat[] = [
    { number: '2,500+', label: 'Student Accommodations' },
    { number: '15+', label: 'Universities Covered' },
    { number: '10,000+', label: 'Happy Students' },
    { number: '98%', label: 'Satisfaction Rate' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-full overflow-hidden px-4 pb-20 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b45309' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <AnimatedElement direction="up" duration={800} distance={30}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600"></span>
                  <span className="text-sm font-semibold text-amber-900">
                    Trusted by 10,000+ Students
                  </span>
                </div>
              </AnimatedElement>

              <AnimatedElement direction="up" duration={800} distance={30} delay={100}>
                <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 sm:text-6xl lg:text-7xl">
                  Find Your Perfect
                  <span className="block bg-linear-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Student Hostel
                  </span>
                </h1>
              </AnimatedElement>

              <AnimatedElement direction="up" duration={800} distance={30} delay={200}>
                <p className="mb-8 text-xl leading-relaxed text-gray-600">
                  The easiest way to discover verified, affordable hostels near Sri Lankan
                  universities. Safe, transparent, and student-friendly.
                </p>
              </AnimatedElement>

              <AnimatedElement direction="up" duration={800} distance={30} delay={300}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button className="accent-btn px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl">
                    Browse Hostels
                  </button>
                  <button className="rounded-xl border-2 border-amber-700 px-8 py-4 text-lg font-semibold text-amber-700 transition-all hover:bg-amber-50">
                    List Your Hostel
                  </button>
                </div>
              </AnimatedElement>

              <AnimatedElement direction="up" duration={800} distance={30} delay={400}>
                <div className="mt-12 flex items-center gap-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-amber-400 to-amber-600 text-sm font-bold text-white"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <FaStar key={i} className="text-lg text-amber-500" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">4.9/5 from 2,400+ reviews</p>
                  </div>
                </div>
              </AnimatedElement>
            </div>

            <div className="relative hidden lg:block">
              <AnimatedElement direction="right" duration={1000} distance={50} delay={200}>
                <div className="relative">
                  {/* Main Image Card */}
                  <div className="surface-card rotate-2 transform p-2">
                    <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-amber-100 to-amber-200">
                      <div className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-white shadow-lg">
                          <FaHome className="text-6xl text-amber-700" aria-hidden="true" />
                        </div>
                        <p className="text-lg font-semibold text-amber-900">
                          Premium Student Accommodation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <ParallaxElement speed={0.3} className="absolute -top-6 -left-6">
                    <div className="surface-card px-6 py-4 shadow-xl">
                      <p className="mb-1 text-3xl font-bold text-amber-700">500+</p>
                      <p className="text-sm text-gray-600">Verified Hostels</p>
                    </div>
                  </ParallaxElement>

                  <ParallaxElement speed={-0.2} className="absolute -right-6 -bottom-6">
                    <div className="surface-card px-6 py-4 text-black shadow-xl">
                      <p className="mb-1 text-3xl font-bold">Rs. 8,500</p>
                      <p className="text-sm opacity-90">Avg. Monthly Rate</p>
                    </div>
                  </ParallaxElement>
                </div>
              </AnimatedElement>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-linear-to-br from-amber-700 to-amber-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <AnimatedElement
                key={index}
                direction="up"
                duration={600}
                delay={index * 100}
                className="text-center"
              >
                <p className="mb-2 text-4xl font-bold text-white lg:text-5xl">{stat.number}</p>
                <p className="text-sm text-amber-100 lg:text-base">{stat.label}</p>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedElement direction="up" duration={800}>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                Why Students Choose UniHome
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Everything you need to find safe, affordable accommodation for your university
                journey
              </p>
            </div>
          </AnimatedElement>

          <div className="grid gap-8 px-10 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <AnimatedElement
                key={index}
                direction="up"
                duration={600}
                delay={index * 100}
                scale={true}
                scaleFrom={0.95}
              >
                <div className="surface-card h-full p-8 transition-all duration-300 hover:shadow-xl">
                  <div className="mb-4 text-5xl">{feature.icon}</div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="leading-relaxed text-gray-600">{feature.description}</p>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section id="universities" className="bg-amber-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedElement direction="up" duration={800}>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                Covering Major Universities
              </h2>
              <p className="text-xl text-gray-600">Find hostels near your university campus</p>
            </div>
          </AnimatedElement>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((university, index) => (
              <AnimatedElement key={index} direction="up" duration={600} delay={index * 80}>
                <div className="surface-card group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-amber-700 text-xl font-bold text-white transition-transform group-hover:scale-110">
                      {university.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-amber-700">
                        {university}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {50 + index * 10} hostels available
                      </p>
                    </div>
                    <FiArrowRight
                      className="text-amber-600 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedElement direction="up" duration={800}>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                Student Success Stories
              </h2>
              <p className="text-xl text-gray-600">
                Hear from students who found their perfect hostel
              </p>
            </div>
          </AnimatedElement>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <AnimatedElement
                key={index}
                direction="up"
                duration={600}
                delay={index * 150}
                scale={true}
              >
                <div className="surface-card flex h-full flex-col p-8">
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar key={i} className="text-lg text-amber-500" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 leading-relaxed text-gray-700 italic">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-amber-700 font-bold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.university}</p>
                    </div>
                  </div>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-amber-700 via-amber-800 to-amber-900 px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <AnimatedElement direction="up" duration={800} scale={true}>
            <h2 className="mb-6 text-4xl font-bold text-white lg:text-5xl">
              Ready to Find Your Ideal Hostel?
            </h2>
            <p className="mb-10 text-xl text-amber-100">
              Join thousands of students who&apos;ve found their perfect accommodation through
              UniHome
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-amber-800 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl">
                Start Your Search
              </button>
              <button className="rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10">
                Learn More
              </button>
            </div>
          </AnimatedElement>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto">
          <div className="mx-auto mb-12 grid max-w-5/6 gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700">
                  <span className="text-xl font-bold text-white">H</span>
                </div>
                <span className="text-2xl font-bold">UniHome</span>
              </div>
              <p className="mb-6 max-w-md text-gray-400">
                Making student accommodation search simple, safe, and transparent for Sri Lankan
                universities.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-amber-700"
                >
                  <FaFacebookF className="text-lg" aria-hidden="true" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-amber-700"
                >
                  <FaLinkedinIn className="text-lg" aria-hidden="true" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-amber-700"
                >
                  <FiMail className="text-lg" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-bold">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Browse Hostels
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    List Your Property
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-bold">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Safety Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-amber-500">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>
              &copy; 2026 UniHome. Made with{' '}
              <FaHeart className="inline-block align-text-bottom" aria-hidden="true" /> for Sri
              Lankan students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
