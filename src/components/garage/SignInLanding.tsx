import { SignInButton } from '@clerk/tanstack-react-start'

import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import { FEATURED_MODEL, paintColorFromName } from '@/data/vehicleModels'

export default function SignInLanding() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <p className="label-caps">Barton Home</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Garage</h1>
      <p className="mt-4 text-garage-muted">
        Keep the collection, odometer, and service history in one place — with
        alerts when oil, tires, or inspection are due.
      </p>
      <div className="garage-panel mt-8 overflow-hidden">
        <VehicleModelCanvas
          spec={FEATURED_MODEL}
          color={paintColorFromName('red')}
          className="h-72 w-full md:h-80"
        />
      </div>
      <SignInButton mode="modal">
        <button type="button" className="btn-primary mt-8">
          Sign in
        </button>
      </SignInButton>
    </div>
  )
}
