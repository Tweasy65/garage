import { createServerFn } from '@tanstack/react-start'

import type { StockImage } from '@/lib/vehicleTypes'

type WikimediaPage = {
  title?: string
  imageinfo?: Array<{
    url?: string
    mime?: string
    thumburl?: string
    descriptionurl?: string
  }>
}

export const searchStockImages = createServerFn({ method: 'GET' })
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<{ images: StockImage[] }> => {
    const query = data.query.trim()
    if (query.length < 2) return { images: [] }

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: `${query} car`,
      gsrnamespace: '6',
      gsrlimit: '12',
      prop: 'imageinfo',
      iiprop: 'url|mime',
      iiurlwidth: '800',
    })

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
      {
        headers: {
          'user-agent':
            'Garage/1.0 (https://garage.bartonhome.dev; vehicle stock search)',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Stock image search failed')
    }

    const json = (await response.json()) as {
      query?: { pages?: Record<string, WikimediaPage> }
    }
    const pages = Object.values(json.query?.pages ?? {})

    const images: StockImage[] = []
    for (const page of pages) {
      const info = page.imageinfo?.[0]
      const mime = info?.mime ?? ''
      const url = info?.thumburl || info?.url
      if (!url || !mime.startsWith('image/') || mime.includes('svg')) continue
      images.push({
        url,
        thumbUrl: info?.thumburl || url,
        title: page.title?.replace(/^File:/, '') ?? 'Stock image',
        source: info?.descriptionurl ?? 'https://commons.wikimedia.org',
      })
    }

    return { images }
  })
