import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const token = formData.get('token')

    let baseUrl = req.nextUrl.origin

    if (
      process.env.REDIRECT_PAYMENT === 'production' &&
      process.env.NEXT_PUBLIC_APP_URL
    ) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL.trim()
    }

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/payment/success`)
    }

    // 303 See Other is appropriate for redirecting POST to GET
    return NextResponse.redirect(`${baseUrl}/payment/success?token=${token}`, {
      status: 303
    })
  } catch (error) {
    console.error('Error handling payment return:', error)

    let baseUrl = req.nextUrl.origin
    if (
      process.env.REDIRECT_PAYMENT === 'production' &&
      process.env.NEXT_PUBLIC_APP_URL
    ) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL.trim()
    }

    return NextResponse.redirect(`${baseUrl}/payment/success`)
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  let baseUrl = req.nextUrl.origin

  if (
    process.env.REDIRECT_PAYMENT === 'production' &&
    process.env.NEXT_PUBLIC_APP_URL
  ) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL.trim()
  }

  return NextResponse.redirect(
    `${baseUrl}/payment/success${token ? `?token=${token}` : ''}`
  )
}
