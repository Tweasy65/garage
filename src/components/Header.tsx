import { CarFront } from 'lucide-react'

import HeaderUser from '@/integrations/clerk/header-user'

export default function Header() {
  return (
    <header className="border-b border-garage-border bg-garage-panel">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center border border-garage-border bg-garage-panel-2">
            <CarFront className="size-4 text-garage-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Garage</p>
            <a
              href="https://bartonhome.dev"
              className="text-[11px] uppercase tracking-wider text-garage-muted hover:text-garage-text"
            >
              bartonhome.dev
            </a>
          </div>
        </div>
        <HeaderUser />
      </div>
    </header>
  )
}
