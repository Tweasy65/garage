/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ApiHealthRouteImport } from './routes/api.health'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

const ApiHealthRoute = ApiHealthRouteImport.update({
  id: '/api/health',
  path: '/api/health',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/api/health': typeof ApiHealthRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/api/health': typeof ApiHealthRoute
}

export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/api/health': typeof ApiHealthRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/api/health'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/api/health'
  id: '__root__' | '/' | '/api/health'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ApiHealthRoute: typeof ApiHealthRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  ApiHealthRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/health': {
      id: '/api/health'
      path: '/api/health'
      fullPath: '/api/health'
      preLoaderRoute: typeof ApiHealthRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
