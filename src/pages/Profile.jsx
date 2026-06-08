import { useState, useEffect } from 'react'
import { Calendar, Flame, Lock, Pencil, Star, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'
import ProgressBar from '../components/common/ProgressBar'
import Toast from '../components/common/Toast'
import { PageShell } from '../components/common/PageShell'
import { BRAND_CTA } from '../utils/brandColors'

const ACHIEVEMENTS = [
  { id: 'first_step', emoji: '🥉', title: 'İlk Adım',  target: 50   },
  { id: 'student',    emoji: '🥈', title: 'Öğrenci',   target: 500  },
  { id: 'scholar',    emoji: '🥇', title: 'Bilgin',    target: 1000 },
  { id: 'master',     emoji: '🏆', title: 'Üstat',     target: 5000 },
]

const Profile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', full_name: '' })
  const [saving, setSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState(null)

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      setLoadingProfile(true)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (fetchError) setError(fetchError.message)
      else setProfile(data)
      setLoadingProfile(false)
    }
    fetchProfile()
  }, [user])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.')
      return
    }

    setPasswordLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (updateError) {
      showToast('Şifre güncellenemedi: ' + updateError.message, 'error')
    } else {
      closePasswordModal()
      showToast('Şifreniz başarıyla güncellendi ✓')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ username: editForm.username.trim(), full_name: editForm.full_name.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (saveError) {
      showToast('Güncelleme başarısız: ' + saveError.message, 'error')
    } else {
      setProfile(prev => ({ ...prev, username: editForm.username.trim(), full_name: editForm.full_name.trim() }))
      setIsEditing(false)
      showToast('Profil başarıyla güncellendi ✓')
    }
  }

  const username = profile?.username ?? user?.email?.split('@')[0] ?? '-'
  const level = profile?.level ?? 0
  const totalXp = profile?.total_xp ?? 0
  const streak = profile?.streak_count ?? 0
  const xpProgress = totalXp % 100

  const formatLastActivity = (dateStr) => {
    if (!dateStr) return 'Henüz aktivite yok'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const ProfileHeader = ({ showEdit = true }) => (
    <div className="rounded-2xl p-[3px] bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500 mb-8">
      <div className="rounded-2xl bg-white dark:bg-gray-900 px-6 py-5 relative">
        {showEdit && !isEditing && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditForm({ username: profile?.username || '', full_name: profile?.full_name || '' })
                setIsEditing(true)
              }}
              title="Profili düzenle"
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 transition-colors"
              aria-label="Profili düzenle"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              title="Şifremi değiştir"
              className="absolute bottom-4 right-4 p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 transition-colors"
              aria-label="Şifremi değiştir"
            >
              <Lock className="w-4 h-4" />
            </button>
          </>
        )}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center text-white font-bold text-3xl md:text-4xl shrink-0 ring-4 ring-rose-200 dark:ring-rose-800 shadow-lg">
            {(profile?.username || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 pr-10">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100">
              {username}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Seviye {level}</span>
              {user?.email && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 mx-2">·</span>
                  <span className="truncate">{user.email}</span>
                </>
              )}
            </p>
            {profile?.full_name && !isEditing && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.full_name}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loadingProfile) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-6">Profilim</h1>
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm">
          Profil yüklenirken hata oluştu: {error}
        </div>
      </PageShell>
    )
  }

  const stats = [
    {
      icon: Flame,
      iconClass: 'text-rose-500 dark:text-rose-400',
      value: `${streak} gün`,
      label: 'Günlük Seri',
      accent: 'rose',
      bgClass: 'bg-gradient-to-br from-white to-rose-50/40 dark:from-gray-800 dark:to-rose-900/10',
    },
    {
      icon: Star,
      iconClass: 'text-violet-500 dark:text-violet-400',
      value: `${totalXp} XP`,
      label: 'Toplam XP',
      accent: null,
      bgClass: 'bg-gradient-to-br from-white to-violet-50/40 dark:from-gray-800 dark:to-violet-900/10 !border-l-4 !border-l-violet-400 dark:!border-l-violet-500',
    },
    {
      icon: Trophy,
      iconClass: 'text-indigo-500 dark:text-indigo-400',
      value: `Seviye ${level}`,
      label: 'Seviye',
      accent: 'indigo',
      bgClass: 'bg-gradient-to-br from-white to-indigo-50/40 dark:from-gray-800 dark:to-indigo-900/10',
    },
    {
      icon: Calendar,
      iconClass: 'text-slate-500 dark:text-slate-400',
      value: formatLastActivity(profile?.last_activity_date),
      label: 'Son Aktivite',
      accent: null,
      bgClass: 'bg-gradient-to-br from-white to-slate-50/40 dark:from-gray-800 dark:to-slate-900/10 !border-l-4 !border-l-slate-400 dark:!border-l-slate-500',
    },
  ]

  return (
    <PageShell maxWidth="max-w-3xl">
      {!isEditing ? (
        <ProfileHeader />
      ) : (
        <Card className="mb-8 border-rose-100 dark:border-rose-800/40">
          <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Profili Düzenle</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kullanıcı Adı</label>
              <input
                value={editForm.username}
                onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ad Soyad</label>
              <input
                value={editForm.full_name}
                onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 py-2 rounded-lg ${BRAND_CTA} text-white text-sm font-medium disabled:opacity-60 transition-colors`}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, iconClass, value, label, accent, bgClass }) => (
          <Card key={label} accent={accent} className={`text-center !p-4 ${bgClass}`}>
            <div className="flex justify-center mb-1.5">
              <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={2} />
            </div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* ── Level Progress ── */}
      <Card>
        <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Seviye İlerlemesi</h2>
        <ProgressBar value={xpProgress} label={`Seviye ${level} - ${xpProgress}/100 XP`} color="green" />
      </Card>

      {/* ── Achievements ── */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">🏅 Başarımlar</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const xp = profile?.total_xp || 0
            const unlocked = xp >= ach.target
            const remaining = ach.target - xp
            return (
              <div
                key={ach.id}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  unlocked
                    ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 grayscale opacity-40'
                }`}
              >
                <span className="text-3xl mb-1">{ach.emoji}</span>
                <span className={`text-xs font-semibold ${unlocked ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {ach.title}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {unlocked ? '✓ Kazanıldı' : `${remaining} XP kaldı`}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        title="Şifremi Değiştir"
        accentGradient="from-rose-500 to-pink-400"
      >
        {passwordError && (
          <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-4">
            {passwordError}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yeni Şifre</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      </div>
    </PageShell>
  )
}

export default Profile
