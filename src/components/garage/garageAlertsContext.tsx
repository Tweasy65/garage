import { useAuth } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import { listMaintenanceAlerts } from '@/server/vehicles'

type GarageAlertsContextValue = {
  alerts: MaintenanceAlert[]
  openCount: number
  refreshAlerts: () => Promise<void>
}

const GarageAlertsContext = createContext<GarageAlertsContextValue | null>(null)

export function GarageAlertsProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([])

  const refreshAlerts = useCallback(async () => {
    if (!userId) {
      setAlerts([])
      return
    }
    try {
      const { alerts: next } = await listMaintenanceAlerts()
      setAlerts(next)
    } catch {
      setAlerts([])
    }
  }, [userId])

  useEffect(() => {
    if (!isLoaded) return
    void refreshAlerts()
  }, [isLoaded, refreshAlerts])

  useEffect(() => {
    if (!userId) return
    return router.subscribe('onLoad', () => {
      void refreshAlerts()
    })
  }, [router, userId, refreshAlerts])

  const openCount = alerts.length

  const value = useMemo(
    () => ({ alerts, openCount, refreshAlerts }),
    [alerts, openCount, refreshAlerts],
  )

  return (
    <GarageAlertsContext.Provider value={value}>
      {children}
    </GarageAlertsContext.Provider>
  )
}

export function useGarageAlerts() {
  const ctx = useContext(GarageAlertsContext)
  if (!ctx) {
    throw new Error('useGarageAlerts must be used within GarageAlertsProvider')
  }
  return ctx
}
