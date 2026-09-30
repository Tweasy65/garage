export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">{children}</div>
  )
}
