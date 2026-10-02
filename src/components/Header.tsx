import { useAuth } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { CarFront, Plus } from 'lucide-react'

import GarageAlertsMenu from '@/components/garage/GarageAlertsMenu'
import HeaderUser from '@/integrations/clerk/header-user'

export default function Header() {
  const { userId } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-garage-border bg-garage-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex size-9 items-center justify-center border border-garage-border bg-garage-panel-2"
              aria-label="Garage collection"
            >
              <CarFront className="size-4 text-garage-accent" />
            </Link>
            <div>
              <Link to="/" className="text-sm font-semibold tracking-tight">
                Garage
              </Link>
              <a
                href="https://bartonhome.dev"
                className="block text-[11px] uppercase tracking-wider text-garage-muted hover:text-garage-text"
              >
                bartonhome.dev
              </a>
            </div>
          </div>
          {userId ? (
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="text-garage-muted hover:text-garage-text"
                activeProps={{ className: 'text-garage-text' }}
              >
                Collection
              </Link>
              <Link
                to="/projects"
                className="text-garage-muted hover:text-garage-text"
                activeProps={{ className: 'text-garage-text' }}
              >
                Projects
              </Link>
              <Link
                to="/service"
                className="text-garage-muted hover:text-garage-text"
                activeProps={{ className: 'text-garage-text' }}
              >
                Service
              </Link>
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {userId ? (
            <Link to="/" search={{ add: true }} className="btn px-3">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add vehicle</span>
            </Link>
          ) : null}
          {userId ? <GarageAlertsMenu /> : null}
          <HeaderUser />
        </div>
      </div>
    </header>
  )
}
