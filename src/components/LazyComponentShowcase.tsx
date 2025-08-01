import { lazy, Suspense } from 'react'

// Lazy load the ComponentShowcase since it's only used for development/demo
const ComponentShowcase = lazy(() => import('./ComponentShowcase'))

export function LazyComponentShowcase() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Ielādē komponentu piemērus...</p>
          </div>
        </div>
      }
    >
      <ComponentShowcase />
    </Suspense>
  )
}

export default LazyComponentShowcase
