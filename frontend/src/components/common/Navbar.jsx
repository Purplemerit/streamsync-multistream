import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import NotificationBell from './NotificationBell'
import { Radio, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out!')
    navigate('/login')
  }

  const home = user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200/80 shadow-soft">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-[1600px] mx-auto">
        <Link to={home} className="flex items-center gap-2.5 group">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-soft transition-transform duration-200 group-hover:scale-105">
            <Radio size={18} />
          </span>
          <span className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-brand-700 transition-colors duration-200">
            StreamSync
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
                {user.avatar && (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-gray-100 object-cover" />
                )}
                <span className="text-gray-700 text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="badge bg-brand-50 text-brand-700 border-brand-100">Admin</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
