import { usePathname } from 'next/navigation'

import { sidebarData } from '@/modules/dashboard/constants'

export const useBreadcrumb = () => {
  const pathname = usePathname()
  const segments: { title: string; url: string }[] = []

  let mainMatch = sidebarData.navMain.find(
    main => pathname.startsWith(main.url) && main.url !== '/'
  )
  if (!mainMatch) mainMatch = sidebarData.navMain.find(main => main.url === '/')
  if (!mainMatch) return [{ title: 'Dashboard', url: '/' }]

  segments.push({ title: mainMatch.title, url: mainMatch.url })

  const subMatch = mainMatch.items.find(sub => pathname.startsWith(sub.url))
  if (subMatch) {
    segments.push({ title: subMatch.title, url: subMatch.url })
  }

  const baseUrl = subMatch ? subMatch.url : mainMatch.url
  const rest = pathname.replace(baseUrl, '').split('/').filter(Boolean)

  rest.forEach((seg, idx) => {
    segments.push({
      title: decodeURIComponent(seg.replace(/-/g, ' ')),
      url: `${baseUrl}/${rest.slice(0, idx + 1).join('/')}`
    })
  })

  return segments
}
