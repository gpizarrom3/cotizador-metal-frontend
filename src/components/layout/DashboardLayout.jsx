import Sidebar from './Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-stone-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
