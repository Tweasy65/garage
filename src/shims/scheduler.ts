type PriorityLevel = 1 | 2 | 3 | 4 | 5

type Task = {
  id: number
  callback: ((didTimeout: boolean) => void | Task['callback']) | null
  cancelled: boolean
  timeoutId: ReturnType<typeof setTimeout> | null
}

export const unstable_ImmediatePriority = 1 as const
export const unstable_UserBlockingPriority = 2 as const
export const unstable_NormalPriority = 3 as const
export const unstable_LowPriority = 4 as const
export const unstable_IdlePriority = 5 as const

let currentPriorityLevel: PriorityLevel = unstable_NormalPriority
let taskId = 0

export function unstable_now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: (didTimeout: boolean) => void | ((didTimeout: boolean) => void),
  options?: { delay?: number },
): Task {
  const delay = options?.delay ?? 0
  const handle: Task = {
    id: ++taskId,
    callback,
    cancelled: false,
    timeoutId: null,
  }

  const run = () => {
    if (handle.cancelled || typeof handle.callback !== 'function') return
    const previous = currentPriorityLevel
    currentPriorityLevel = priorityLevel
    try {
      const continuation = handle.callback(false)
      handle.callback = typeof continuation === 'function' ? continuation : null
      if (typeof handle.callback === 'function') {
        handle.timeoutId = setTimeout(run, 0)
      }
    } finally {
      currentPriorityLevel = previous
    }
  }

  handle.timeoutId = setTimeout(run, delay)
  return handle
}

export function unstable_cancelCallback(handle: Task | null | undefined) {
  if (!handle) return
  handle.cancelled = true
  handle.callback = null
  if (handle.timeoutId != null) {
    clearTimeout(handle.timeoutId)
    handle.timeoutId = null
  }
}

export function unstable_shouldYield() {
  return false
}

export function unstable_requestPaint() {}

export function unstable_getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel
}

export function unstable_runWithPriority<T>(
  priorityLevel: PriorityLevel,
  eventHandler: () => T,
): T {
  const previous = currentPriorityLevel
  currentPriorityLevel = priorityLevel
  try {
    return eventHandler()
  } finally {
    currentPriorityLevel = previous
  }
}

export function unstable_next<T>(eventHandler: () => T): T {
  const nextLevel: PriorityLevel =
    currentPriorityLevel === unstable_ImmediatePriority ||
    currentPriorityLevel === unstable_UserBlockingPriority ||
    currentPriorityLevel === unstable_NormalPriority
      ? unstable_NormalPriority
      : currentPriorityLevel
  return unstable_runWithPriority(nextLevel, eventHandler)
}

export function unstable_wrapCallback<T extends (...args: never[]) => unknown>(
  callback: T,
): T {
  const parent = currentPriorityLevel
  return function wrapped(this: unknown, ...args: never[]) {
    const previous = currentPriorityLevel
    currentPriorityLevel = parent
    try {
      return callback.apply(this, args)
    } finally {
      currentPriorityLevel = previous
    }
  } as T
}

export function unstable_pauseExecution() {}
export function unstable_continueExecution() {}
export function unstable_getFirstCallbackNode() {
  return null
}
export function unstable_forceFrameRate(_fps?: number) {}

const api = {
  unstable_ImmediatePriority,
  unstable_UserBlockingPriority,
  unstable_NormalPriority,
  unstable_LowPriority,
  unstable_IdlePriority,
  unstable_now,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_shouldYield,
  unstable_requestPaint,
  unstable_getCurrentPriorityLevel,
  unstable_runWithPriority,
  unstable_next,
  unstable_wrapCallback,
  unstable_pauseExecution,
  unstable_continueExecution,
  unstable_getFirstCallbackNode,
  unstable_forceFrameRate,
}

export default api
