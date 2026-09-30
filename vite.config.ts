import { readFileSync, existsSync } from 'node:fs'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

function stripJsonComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/[^\n]*/gm, '')
}

function publishableKeyFromWrangler(): string {
  const path = fileURLToPath(new URL('./wrangler.jsonc', import.meta.url))
  if (!existsSync(path)) return ''
  try {
    const raw = readFileSync(path, 'utf8')
    const j = JSON.parse(stripJsonComments(raw)) as {
      vars?: Record<string, string | undefined>
    }
    return (
      j.vars?.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
      j.vars?.CLERK_PUBLISHABLE_KEY?.trim() ||
      ''
    )
  } catch {
    return ''
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const clerkPublishableKey =
    process.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
    env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
    env.CLERK_PUBLISHABLE_KEY?.trim() ||
    publishableKeyFromWrangler()

  return {
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(
        clerkPublishableKey,
      ),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        scheduler: fileURLToPath(
          new URL('./src/shims/scheduler.ts', import.meta.url),
        ),
        'scheduler/index.js': fileURLToPath(
          new URL('./src/shims/scheduler.ts', import.meta.url),
        ),
        'stats.js': fileURLToPath(
          new URL('./src/shims/stats.ts', import.meta.url),
        ),
        'stats.js/build/stats.min.js': fileURLToPath(
          new URL('./src/shims/stats.ts', import.meta.url),
        ),
        'use-sync-external-store/shim/with-selector.js': fileURLToPath(
          new URL(
            './src/shims/use-sync-external-store-with-selector.ts',
            import.meta.url,
          ),
        ),
        'use-sync-external-store/shim/with-selector': fileURLToPath(
          new URL(
            './src/shims/use-sync-external-store-with-selector.ts',
            import.meta.url,
          ),
        ),
      },
      dedupe: ['@clerk/react', 'react', 'react-dom', 'scheduler'],
    },
    server: {
      port: 3089,
      strictPort: true,
      host: '0.0.0.0',
    },
    assetsInclude: ['**/*.glb'],
    optimizeDeps: {
      include: ['@clerk/react', '@clerk/tanstack-react-start'],
      exclude: [
        '@clerk/backend',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        '@cloudflare/unenv-preset/node/process',
        'scheduler',
        'stats.js',
        'use-sync-external-store',
        'use-sync-external-store/shim/with-selector',
      ],
    },
    ssr: {
      optimizeDeps: {
        exclude: [
          'three',
          '@react-three/fiber',
          '@react-three/drei',
          '@cloudflare/unenv-preset/node/process',
          'scheduler',
        ],
      },
    },
    plugins: [
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart({
        client: {
          entry: 'src/client.tsx',
        },
      }),
      viteReact(),
    ],
  }
})
