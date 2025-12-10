import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/api/payments(.*)',
  '/payment/success(.*)',
  '/payment/schedule(.*)',
  '/payment/receipt(.*)',
  '/api/payments/return'
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and payment callbacks (to avoid Clerk handshake on POST)
    '/((?!_next|api/payments/return|api/payments/webhook|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes, except payment callbacks
    '/(api(?!/payments/return|/payments/webhook)|trpc)(.*)'
  ]
}
