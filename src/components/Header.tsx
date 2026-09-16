import { CarFront } from 'lucide-react'

import HeaderUser from '@/integrations/clerk/header-user'

export default function Header() {
  return (
    <header className="border-b border-garage-border bg-garage-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <CarFront className="size-5 text-garage-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Garage</p>
            <a
              href="https://bartonhome.dev"
              className="text-xs text-garage-muted transition hover:text-white"
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
