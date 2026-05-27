import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import API from '../../utils/axios'
import toast from 'react-hot-toast'
import { Radio, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'

const perks = [
  'Stream to 10 platforms simultaneously',
  'Upload videos up to 2GB',
  'Real-time stream monitoring',
  'Full stream history & analytics',
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (!agreedToTerms) return toast.error('Please read and agree to the Terms & Conditions first')
    setLoading(true)
    try {
      const res = await API.post('/auth/register', form)
      login(res.data.token, res.data.user)
      toast.success('Account created! Welcome 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-600 to-violet-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <span className="bg-white/20 p-2 rounded-lg backdrop-blur"><Radio size={18} /></span>
          <span className="text-xl font-bold">StreamSync</span>
        </Link>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-4 leading-tight">
            Start streaming<br />for free 🚀
          </h1>
          <p className="text-violet-100 text-lg mb-8">
            Join thousands of creators going live on multiple platforms at once.
          </p>
          <div className="space-y-3">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 border border-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-violet-50 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-violet-200/80 text-xs relative z-10">© 2026 StreamSync — Purple Merit</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">

          <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-violet-600 text-sm mb-8 transition">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="bg-violet-600 text-white p-2 rounded-lg"><Radio size={18} /></span>
            <span className="text-xl font-bold text-slate-900">StreamSync</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-1">Create account</h2>
          <p className="text-slate-500 mb-8 text-sm">Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-600 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Full Name</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="Your name" required
                className="input-field"
              />
            </div>

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
                  placeholder="Min. 6 characters" required
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <div
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border-2 transition shrink-0 mt-0.5 ${
                  agreedToTerms
                    ? 'bg-violet-600 border-violet-600'
                    : 'bg-white border-slate-300 hover:border-violet-500'
                }`}
              >
                {agreedToTerms && <Check size={12} className="text-white" />}
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                I have read and agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-violet-600 hover:text-violet-700 underline underline-offset-2 transition"
                >
                  Terms & Conditions
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full btn-primary py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold transition">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
