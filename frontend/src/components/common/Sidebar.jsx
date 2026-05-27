import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Video, Radio, History,
  Users, Film, Activity, Key,
  DollarSign, Lightbulb, BarChart2, KeyRound, UserPlus, Tv2,
} from 'lucide-react'

const SectionLabel = ({ label }) => (
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-1 hidden lg:block">
    {label}
  </p>
)

const SidebarLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
        isActive
          ? 'bg-brand-600 text-white shadow-soft scale-[1.02]'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    {icon}
    {label}
  </NavLink>
)

export default function Sidebar() {
  const { user } = useAuth()

  const shell = (children) => (
    <aside className="w-full lg:w-56 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200/80 lg:min-h-[calc(100vh-57px)]">
      <nav className="flex lg:flex-col gap-0.5 p-3 overflow-x-auto lg:overflow-visible scrollbar-hide">
        {children}
      </nav>
    </aside>
  )

  if (user?.role === 'admin') {
    return shell(
      <>
        <SectionLabel label="Overview" />
        <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <SectionLabel label="Content" />
        <SidebarLink to="/admin/users" icon={<Users size={18} />} label="Users" />
        <SidebarLink to="/admin/videos" icon={<Film size={18} />} label="Videos" />
        <SidebarLink to="/admin/streams" icon={<Activity size={18} />} label="Streams" />
        <SectionLabel label="Analytics" />
        <SidebarLink to="/admin/platform-popularity" icon={<BarChart2 size={18} />} label="Popularity" />
        <SidebarLink to="/admin/stream-keys-saved" icon={<KeyRound size={18} />} label="Keys" />
        <SidebarLink to="/admin/recent-registrations" icon={<UserPlus size={18} />} label="Signups" />
        <SectionLabel label="Live" />
        <SidebarLink to="/admin/live-stats" icon={<Tv2 size={18} />} label="Live Stats" />
      </>
    )
  }

  return shell(
    <>
      <SectionLabel label="Main" />
      <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink to="/my-videos" icon={<Video size={18} />} label="Videos" />
      <SidebarLink to="/stream" icon={<Radio size={18} />} label="Go Live" />
      <SidebarLink to="/history" icon={<History size={18} />} label="History" />
      <SidebarLink to="/stream-keys" icon={<Key size={18} />} label="Keys" />
      <SectionLabel label="Insights" />
      <SidebarLink to="/live-stats" icon={<Tv2 size={18} />} label="Live Stats" />
      <SectionLabel label="Learn" />
      <SidebarLink to="/streaming-tips" icon={<Lightbulb size={18} />} label="Tips" />
      <SidebarLink to="/monetization" icon={<DollarSign size={18} />} label="Monetization" />
    </>
  )
}
