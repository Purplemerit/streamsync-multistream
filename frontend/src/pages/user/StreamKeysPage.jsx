import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import { PLATFORMS as BASE_PLATFORMS } from '../../constants/platforms'
import toast from 'react-hot-toast'
import {
  Eye, EyeOff, Trash2, Plus, X, Link2, LinkIcon, CheckCircle2, Loader2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const MAX_ACCOUNTS = 15

const KEY_TYPE = {
  youtube: 'permanent', twitch: 'permanent', facebook: 'permanent',
  kick: 'permanent', rumble: 'permanent', telegram: 'permanent', x: 'permanent',
  instagram: 'session', tiktok: 'session', bigo: 'session',
}

const PLATFORMS = BASE_PLATFORMS.map((p) => ({
  ...p,
  type: KEY_TYPE[p.id] || 'permanent',
}))

const PLATFORM_NOTES = {
  rumble: 'If streaming fails with "Invalid stream key", go to rumble.com → Live Streaming → Static Stream Keys and copy the latest key.',
  kick: 'Kick requires both a Stream Key and a Stream URL from your Kick dashboard.',
  instagram: 'Instagram generates a new key every session. Copy a fresh key before each stream.',
  tiktok: 'TikTok is not available in India. Session keys must be refreshed before each stream.',
  bigo: 'BIGO LIVE is not available in India. Session keys must be refreshed before each stream.',
}

const OAUTH_PLATFORMS = ['youtube', 'twitch']

const emptyAddForm = () => ({ label: '', streamKey: '', rtmpUrl: '', twitchUsername: '' })

export default function StreamKeysPage() {
  const [accounts, setAccounts] = useState({})
  const [visibleKeys, setVisibleKeys] = useState({})
  const [openAddForm, setOpenAddForm] = useState(null)
  const [addForms, setAddForms] = useState({})
  const [saving, setSaving] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState({})
  const [searchParams] = useSearchParams()

  const loadAccounts = () => {
    return API.get('/streamkeys/my')
      .then((res) => setAccounts(res.data))
      .catch(() => toast.error('Failed to load stream keys'))
  }

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false))

    API.get('/auth/platform/status')
      .then((res) => setConnections(res.data))
      .catch(() => {})

    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) toast.success(`${connected} connected for live stats!`)
    if (error) toast.error(`Failed to connect ${error}. Try again.`)
  }, [searchParams])

  const accountKey = (platformId, accountId) => `${platformId}-${accountId}`

  const toggleVisibility = (platformId, accountId) => {
    const key = accountKey(platformId, accountId)
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getAddForm = (platformId) => addForms[platformId] || emptyAddForm()

  const updateAddForm = (platformId, field, value) => {
    setAddForms((prev) => ({
      ...prev,
      [platformId]: { ...getAddForm(platformId), [field]: value },
    }))
  }

  const openForm = (platformId) => {
    setOpenAddForm(platformId)
    setAddForms((prev) => ({ ...prev, [platformId]: emptyAddForm() }))
  }

  const closeForm = (platformId) => {
    setOpenAddForm((current) => (current === platformId ? null : current))
    setAddForms((prev) => {
      const next = { ...prev }
      delete next[platformId]
      return next
    })
  }

  const handleOAuthConnect = async (platform) => {
    try {
      const res = await API.get(`/auth/platform/${platform}`)
      window.location.href = res.data.url
    } catch {
      toast.error(`Failed to start ${platform} connection`)
    }
  }

  const handleOAuthDisconnect = async (platform) => {
    try {
      await API.delete(`/auth/platform/disconnect/${platform}`)
      setConnections((prev) => ({ ...prev, [platform]: { connected: false } }))
      toast.success(`${platform} disconnected`)
    } catch {
      toast.error(`Failed to disconnect ${platform}`)
    }
  }

  const handleSave = async (platformId) => {
    const form = getAddForm(platformId)
    if (!form.streamKey.trim()) return toast.error('Stream key is required')

    const platform = PLATFORMS.find((p) => p.id === platformId)
    if (platform?.needsUrl && !form.rtmpUrl.trim()) {
      return toast.error(`Please enter ${platform.label} Stream URL`)
    }

    setSaving(platformId)
    try {
      await API.post('/streamkeys/save', {
        platform: platformId,
        streamKey: form.streamKey.trim(),
        rtmpUrl: platform?.needsUrl ? form.rtmpUrl.trim() : undefined,
        label: form.label.trim() || undefined,
        twitchUsername: platformId === 'twitch' && form.twitchUsername.trim()
          ? form.twitchUsername.trim()
          : undefined,
      })
      toast.success('Account saved!')
      closeForm(platformId)
      await loadAccounts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account')
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (platformId, accountId, label) => {
    if (!confirm(`Remove "${label}" from ${platformId}?`)) return
    setDeleting(accountKey(platformId, accountId))
    try {
      await API.delete(`/streamkeys/delete/${platformId}/${accountId}`)
      toast.success('Account removed')
      await loadAccounts()
    } catch {
      toast.error('Failed to remove account')
    } finally {
      setDeleting(null)
    }
  }

  const OAuthBanner = ({ platformId, label }) => {
    const isConnected = connections[platformId]?.connected
    const username = connections[platformId]?.username

    return (
      <div className={`rounded-lg px-3 py-2.5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        isConnected ? 'bg-green-50 border border-green-200' : 'bg-violet-50 border border-violet-200'
      }`}>
        <div className="flex items-start gap-2">
          {isConnected
            ? <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
            : <LinkIcon size={16} className="text-violet-600 mt-0.5 shrink-0" />
          }
          <div>
            <p className={`text-xs font-medium ${isConnected ? 'text-green-800' : 'text-violet-800'}`}>
              {isConnected
                ? `Connected for Live Stats${username ? ` · @${username}` : ''}`
                : 'Connect account to enable Live Stats'}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {isConnected
                ? 'Viewers, likes and chat are tracked automatically'
                : `Link your ${label} account to see real-time stats`}
            </p>
          </div>
        </div>
        <button
          onClick={() => isConnected ? handleOAuthDisconnect(platformId) : handleOAuthConnect(platformId)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition shrink-0 ${
            isConnected
              ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {isConnected ? 'Disconnect' : `Connect ${label}`}
        </button>
      </div>
    )
  }

  const PlatformCard = ({ platform }) => {
    const platformAccounts = Array.isArray(accounts[platform.id]) ? accounts[platform.id] : []
    const atLimit = platformAccounts.length >= MAX_ACCOUNTS
    const isFormOpen = openAddForm === platform.id
    const form = getAddForm(platform.id)
    const note = PLATFORM_NOTES[platform.id]

    return (
      <div className="card-interactive overflow-hidden h-full flex flex-col">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full shrink-0 ${platform.dot}`} />
            <h3 className="font-semibold text-gray-900">
              {platform.label}
              <span className="badge bg-brand-50 text-brand-700 border border-brand-100 ml-2">
                {platformAccounts.length}/{MAX_ACCOUNTS}
              </span>
            </h3>
            {platform.type === 'session' && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                Session key
              </span>
            )}
          </div>
          {!atLimit && (
            <button
              onClick={() => isFormOpen ? closeForm(platform.id) : openForm(platform.id)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition"
            >
              {isFormOpen ? <X size={14} /> : <Plus size={14} />}
              {isFormOpen ? 'Cancel' : 'Add Account'}
            </button>
          )}
        </div>

        <div className="px-4 sm:px-5 py-4">
          {OAUTH_PLATFORMS.includes(platform.id) && (
            <OAuthBanner platformId={platform.id} label={platform.label} />
          )}

          {note && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-800 leading-relaxed">
              {note}
            </div>
          )}

          <div
            className={`grid transition-all duration-200 ease-out ${
              isFormOpen ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0'
            }`}
          >
            <div className="overflow-hidden">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">New {platform.label} account</p>
              <input
                type="text"
                placeholder="Label (e.g. Main Channel, Gaming Channel)"
                value={form.label}
                onChange={(e) => updateAddForm(platform.id, 'label', e.target.value)}
                className="input-field rounded-lg py-2"
              />
              <input
                type="text"
                placeholder={`${platform.label} stream key`}
                value={form.streamKey}
                onChange={(e) => updateAddForm(platform.id, 'streamKey', e.target.value)}
                className="input-field rounded-lg py-2 font-mono"
              />
              {platform.needsUrl && (
                <input
                  type="text"
                  placeholder={`${platform.label} Stream URL (rtmps://...)`}
                  value={form.rtmpUrl}
                  onChange={(e) => updateAddForm(platform.id, 'rtmpUrl', e.target.value)}
                  className="input-field rounded-lg py-2 font-mono"
                />
              )}
              {platform.id === 'twitch' && (
                <input
                  type="text"
                  placeholder="Twitch username (for live viewer count)"
                  value={form.twitchUsername}
                  onChange={(e) => updateAddForm(platform.id, 'twitchUsername', e.target.value)}
                  className="input-field rounded-lg py-2"
                />
              )}
              <button
                onClick={() => handleSave(platform.id)}
                disabled={saving === platform.id}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {saving === platform.id ? <Loader2 size={14} className="animate-spin" /> : null}
                Save Account
              </button>
            </div>
            </div>
          </div>

          {platformAccounts.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              No accounts saved yet. Click &quot;Add Account&quot; to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {platformAccounts.map((acc) => {
                const visKey = accountKey(platform.id, acc.accountId)
                const isVisible = visibleKeys[visKey]
                const isDeleting = deleting === visKey

                return (
                  <li
                    key={acc.accountId}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{acc.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="flex-1 font-mono text-xs text-slate-500 truncate">
                          {isVisible ? acc.streamKey : '••••••••••••••••••••••••'}
                        </p>
                        <button
                          onClick={() => toggleVisibility(platform.id, acc.accountId)}
                          className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
                          aria-label={isVisible ? 'Hide key' : 'Show key'}
                        >
                          {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {acc.rtmpUrl && (
                        <p className="text-xs text-slate-400 mt-1 truncate font-mono">{acc.rtmpUrl}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(platform.id, acc.accountId, acc.label)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition shrink-0 self-start sm:self-center disabled:opacity-60"
                    >
                      {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {atLimit && (
            <p className="text-xs text-slate-400 mt-3">Maximum {MAX_ACCOUNTS} accounts reached for this platform.</p>
          )}
        </div>
      </div>
    )
  }

  const permanentPlatforms = PLATFORMS.filter((p) => p.type === 'permanent')
  const sessionPlatforms = PLATFORMS.filter((p) => p.type === 'session')

  return (
    <AppLayout
      title="Stream Keys"
      subtitle={`Manage multiple accounts per platform — up to ${MAX_ACCOUNTS} each.`}
      maxWidth="max-w-5xl"
    >
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
            <Link2 size={18} className="text-violet-600 shrink-0 mt-0.5" />
            <p className="text-violet-800 text-sm">
              Connect <strong>YouTube</strong> and <strong>Twitch</strong> for real-time Live Stats.
              Stream keys and OAuth connections are managed separately.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
              <Loader2 size={20} className="animate-spin" />
              Loading accounts...
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Permanent Keys</h2>
                <p className="text-slate-500 text-xs sm:text-sm mb-4">
                  Save once and reuse — keys stay valid until you reset them on the platform.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permanentPlatforms.map((p) => (
                    <PlatformCard key={p.id} platform={p} />
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-heading text-gray-900 mb-1">Session Keys</h2>
                <p className="text-caption text-gray-500 mb-4">
                  New key each session — update before going live.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionPlatforms.map((p) => (
                    <PlatformCard key={p.id} platform={p} />
                  ))}
                </div>
              </section>
            </div>
          )}
    </AppLayout>
  )
}
