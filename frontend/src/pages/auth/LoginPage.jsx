import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import API from '../../utils/axios'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Radio, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { PLATFORMS } from '../../constants/platforms'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.post('/auth/login', form)
      login(res.data.token, res.data.user)
      toast.success('Welcome back!')
      navigate(res.data.user?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post('/auth/google/token', { token: credentialResponse.credential })
      login(res.data.token, res.data.user)
      toast.success('Welcome!')
      navigate(res.data.user?.role === 'admin' ? '/admin' : '/dashboard')
    } catch {
      toast.error('Google login failed')
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <span className="bg-white/20 p-2 rounded-lg backdrop-blur"><Radio size={18} /></span>
          <span className="text-xl font-bold">StreamSync</span>
        </Link>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-4 leading-tight">Welcome back</h1>
          <p className="text-violet-100 text-lg mb-8">Log in to multistream to all your saved accounts.</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.slice(0, 6).map((p) => (
              <span key={p.id} className="text-xs font-medium bg-white/15 border border-white/20 px-3 py-1.5 rounded-full">
                {p.label}
              </span>
            ))}
            <span className="text-xs font-medium bg-white/15 px-3 py-1.5 rounded-full">+4 more</span>
          </div>
        </div>
        <p className="text-violet-200/80 text-xs relative z-10">© 2026 StreamSync — Purple Merit, Bengaluru</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-brand-600 text-sm mb-8 transition-all duration-200">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="bg-brand-600 text-white p-2 rounded-lg"><Radio size={18} /></span>
            <span className="text-xl font-bold text-slate-900">StreamSync</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-1">Login</h2>
          <p className="text-slate-500 mb-8 text-sm">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-600 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="you@example.com" required
                className="input-field"
              />
            </div>
            <div>
              <label className="text-slate-600 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-sm">
              {loading ? 'Logging in...' : 'Login to Dashboard →'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-4 text-slate-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              theme="outline" shape="rectangular" width="400"
            />
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-semibold">Register free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
