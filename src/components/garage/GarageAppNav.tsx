import { Link } from '@tanstack/react-router'
import { CarFront, ClipboardList, Wrench, type LucideIcon } from 'lucide-react'

const LINKS: {
  to: '/' | '/projects' | '/service'
  label: string
  icon: LucideIcon
  exact?: boolean
}[] = [
  { to: '/', label: 'Collection', icon: CarFront, exact: true },
  { to: '/projects', label: 'Projects', icon: ClipboardList },
  { to: '/service', label: 'Service', icon: Wrench },
]

export default function GarageAppNav({
  variant,
}: {
  variant: 'header' | 'mobile'
}) {
  if (variant === 'header') {
    return (
      <nav className="hidden items-center gap-4 text-sm sm:flex" aria-label="Garage">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={link.exact ? { exact: true } : undefined}
            className="text-garage-muted hover:text-garage-text"
            activeProps={{ className: 'text-garage-text' }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-garage-border bg-garage-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      aria-label="Garage"
    >
      <ul className="mx-auto grid max-w-7xl grid-cols-3">
        {LINKS.map((link) => {
          const Icon = link.icon
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                activeOptions={link.exact ? { exact: true } : undefined}
                className="flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium text-garage-muted"
                activeProps={{ className: 'text-garage-text' }}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
