import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout({ children, title, subtitle, maxWidth = 'max-w-6xl', headerExtra }) {
  return (
    <div className="min-h-screen bg-surface-muted text-gray-900">
      <Navbar />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto ${maxWidth}`}>
          {(title || subtitle || headerExtra) && (
            <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-gray-500 mt-1 text-sm sm:text-body">{subtitle}</p>
                )}
              </div>
              {headerExtra}
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

