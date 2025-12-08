import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const token = formData.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/payment-success', req.url))
    }

    // 303 See Other is appropriate for redirecting POST to GET
    return NextResponse.redirect(
      new URL(`/payment-success?token=${token}`, req.url),
      { status: 303 }
    )
  } catch (error) {
    console.error('Error handling payment return:', error)
    return NextResponse.redirect(new URL('/payment-success', req.url))
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  return NextResponse.redirect(
    new URL(`/payment-success${token ? `?token=${token}` : ''}`, req.url)
  )
}
