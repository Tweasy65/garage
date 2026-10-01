import { Link } from '@tanstack/react-router'

import { Plus } from 'lucide-react'



import MaintenanceForm from '@/components/garage/MaintenanceForm'

import MaintenanceList from '@/components/garage/MaintenanceList'

import Modal from '@/components/garage/Modal'

import type { MaintenanceInput, VehicleDetail } from '@/lib/vehicleTypes'



type VehicleServiceTabProps = {

  vehicle: VehicleDetail

  logOpen: boolean

  onOpenLog: () => void

  onCloseLog: () => void

  onAddRecord: (values: MaintenanceInput) => Promise<void>

  onDeleteRecord: (id: string) => Promise<void>

  onUpdateRecord: (id: string, values: MaintenanceInput) => Promise<void>

}



export default function VehicleServiceTab({

  vehicle,

  logOpen,

  onOpenLog,

  onCloseLog,

  onAddRecord,

  onDeleteRecord,

  onUpdateRecord,

}: VehicleServiceTabProps) {

  return (

    <div role="tabpanel" id="vehicle-tab-service" aria-labelledby="tab-service">

      <div className="section-header">

        <div>

          <p className="label-caps">Service</p>

          <h2 className="mt-1 text-base font-semibold">History</h2>

        </div>

        <button type="button" className="btn-primary px-3 text-xs" onClick={onOpenLog}>

          <Plus className="size-3.5" />

          Log service

        </button>

      </div>



      <div className="section-body">

        <MaintenanceList

          records={vehicle.maintenance}

          onDelete={(id) => void onDeleteRecord(id)}

          onUpdate={onUpdateRecord}

        />

      </div>



      <div className="border-t border-garage-border px-6 py-4">

        <Link

          to="/service"

          search={{ vehicle: vehicle.id }}

          className="text-sm text-garage-muted hover:text-garage-text"

        >

          View in fleet service table →

        </Link>

      </div>



      <Modal

        open={logOpen}

        onClose={onCloseLog}

        size="md"

        hint="Maintenance"

        title="Log service"

      >

        <MaintenanceForm

          vehicleId={vehicle.id}

          defaultMileage={vehicle.mileage}

          onSubmit={onAddRecord}

          onCancel={onCloseLog}

        />

      </Modal>

    </div>

  )

}


