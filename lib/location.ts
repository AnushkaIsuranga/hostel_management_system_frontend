export type Coordinates = {
  latitude: number
  longitude: number
}

const PLACE_COORDINATES_REGEX = /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/
const AT_COORDINATES_REGEX = /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/
const QUERY_COORDINATES_REGEX = /(?:\?|&)(?:q|query)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/i
const RAW_COORDINATES_REGEX = /(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

export function isGoogleMapsUrl(url: string): boolean {
  const input = url.trim()
  if (!input) return false

  try {
    const parsed = new URL(input)
    const host = parsed.hostname.toLowerCase()
    return (
      host.includes('google.com') ||
      host.includes('maps.google.com') ||
      host.includes('maps.app.goo.gl') ||
      host.includes('goo.gl')
    )
  } catch {
    return false
  }
}

export function tryExtractCoordinates(url: string): Coordinates | null {
  const input = url.trim()
  if (!input) return null

  const match =
    input.match(PLACE_COORDINATES_REGEX) ||
    input.match(AT_COORDINATES_REGEX) ||
    input.match(QUERY_COORDINATES_REGEX) ||
    input.match(RAW_COORDINATES_REGEX)
  if (!match) return null

  const latitude = Number(match[1])
  const longitude = Number(match[2])

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null
  }

  return { latitude, longitude }
}

export function buildGoogleMapsQueryUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}
