export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
      {children}
    </div>
  )
}
