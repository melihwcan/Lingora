import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, fetchPaginatedRows } from '../lib/supabaseClient'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import EmptyState from '../components/common/EmptyState'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../context/AuthContext'
import { uploadAudioFile, deleteAudioFile } from '../utils/uploadAudio'
import { getDifficultyColor } from '../utils/difficultyColors'
import { getDifficultyLabel, getModuleTypeLabel } from '../utils/labels'
import {
  mergeWithKnownCategories,
  getCategoryLabel,
  normalizeCategory,
  buildCategoryMetaMap,
  capitalizeCategoryLabel,
  resolveCanonicalCategoryKey,
  getCategoryMatchKeys,
} from '../utils/vocabularyCategories'
import { fetchCategoryMeta, upsertCategoryMeta, deleteCategoryMeta } from '../utils/categoryMeta'
import { deleteCategoryContent } from '../utils/categoryDelete'
import { setCategoryMetaCache, getCategoryTheme, getThemePresetById, getLucideIcon, CURATED_CATEGORY_ICONS } from '../utils/categoryTheme'
import CategoryIconPicker from '../components/admin/CategoryIconPicker'
import ListeningQuestionsEditor, { emptyListeningQuestion } from '../components/admin/ListeningQuestionsEditor'
import FormattingTextarea from '../components/admin/FormattingTextarea'
import { fetchListeningQuestions, saveListeningQuestions } from '../utils/listeningQuestions'
import { DARK_SURFACE, DARK_CARD, DARK_BORDER } from '../utils/brandColors'

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const MODULE_TYPES = ['reading', 'listening', 'vocabulary']
const USERS_PER_PAGE = 10
const VOCAB_PER_PAGE = 10

const typeBadge = {
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  listening: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  vocabulary: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const colorDot = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  neutral: 'bg-slate-400',
  assassin: 'bg-gray-900',
}

// ─── Input helpers ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-500 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1'
const fileInputCls =
  'w-full border border-slate-200 dark:border-neutral-700 dark:bg-neutral-900 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900/40 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60'
const editBtnCls =
  'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1 rounded-lg text-sm font-medium border border-indigo-200 dark:border-indigo-800 transition-colors'
const deleteBtnCls =
  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 transition-colors'
const cancelBtnCls =
  'px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors'

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ─── Empty form states ─────────────────────────────────────────────────────────
const emptyModuleForm = {
  title: '',
  description: '',
  type: 'reading',
  difficulty: 'beginner',
  content: '',
  audio_url: '',
  xp_reward: 30,
  is_published: false,
}

const emptyVocabForm = {
  word: '',
  meaning: '',
  category: '',
  difficulty: '',
  example_sentence: '',
  example_translation: '',
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Data
  const [modules, setModules] = useState([])
  const [vocab, setVocab] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  // UI state - main tabs
  const [mainTab, setMainTab] = useState('content') // 'content' | 'users'
  const [contentTab, setContentTab] = useState('modules') // 'modules' | 'words' | 'quizzes' | 'categories'

  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [publishFilter, setPublishFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const debouncedSearch = useDebounce(search, 400)

  // Users tab state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [wordPage, setWordPage] = useState(1)
  const debouncedUserSearch = useDebounce(userSearch, 400)

  // Add-new modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState('reading') // 'reading' | 'listening' (modules only)
  const [moduleForm, setModuleForm] = useState(emptyModuleForm)
  const [vocabForm, setVocabForm] = useState(emptyVocabForm)
  const [newQuizForm, setNewQuizForm] = useState({
    category: '',
    difficulty: 'beginner',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
  })
  const [submitting, setSubmitting] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [existingCategories, setExistingCategories] = useState([])
  const [categoryMeta, setCategoryMeta] = useState([])
  const [newCategoryForm, setNewCategoryForm] = useState({ slug: '', labelTr: '', iconName: '', themePreset: '' })
  const [editCategoryModal, setEditCategoryModal] = useState(null)
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState(null)
  const [categorySaving, setCategorySaving] = useState(false)

  // Edit modal
  const [editItem, setEditItem] = useState(null) // { kind: 'module'|'vocab', data: {...} }
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editAudioFile, setEditAudioFile] = useState(null)
  const [addListeningQuestions, setAddListeningQuestions] = useState([])
  const [editListeningQuestions, setEditListeningQuestions] = useState([])

  // Edit quiz modal
  const [showEditQuizModal, setShowEditQuizModal] = useState(false)
  const [editQuizForm, setEditQuizForm] = useState(null)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null) // { kind, id, name }
  const [deleting, setDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => setToast({ message, type })

  const categoryMetaMap = buildCategoryMetaMap(categoryMeta)

  const categoryWordCounts = useMemo(() => {
    const counts = {}
    for (const w of vocab) {
      const key = resolveCanonicalCategoryKey(w.category, categoryMetaMap)
      if (key) counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [vocab, categoryMetaMap])

  const categoryQuizCounts = useMemo(() => {
    const counts = {}
    for (const q of quizzes) {
      const key = resolveCanonicalCategoryKey(q.category, categoryMetaMap)
      if (key) counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [quizzes, categoryMetaMap])

  function openEditCategory(category) {
    const key = normalizeCategory(category)
    const meta = categoryMetaMap[key]
    const theme = getCategoryTheme(key, categoryMetaMap)
    const matchedIcon = CURATED_CATEGORY_ICONS.find(({ name }) => getLucideIcon(name) === theme.Icon)
    setEditCategoryModal({
      category: key,
      labelTr: getCategoryLabel(key, categoryMetaMap),
      iconName: meta?.icon_name || matchedIcon?.name || 'Languages',
      themePreset: meta?.theme_preset || '',
    })
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    const slug = normalizeCategory(newCategoryForm.slug)
    if (!slug) {
      showToast('DB kodu zorunludur.', 'error')
      return
    }
    if (existingCategories.includes(slug)) {
      showToast('Bu kategori zaten mevcut.', 'error')
      return
    }
    if (!newCategoryForm.iconName || !newCategoryForm.themePreset) {
      showToast('İkon ve renk teması seçmelisiniz.', 'error')
      return
    }
    setCategorySaving(true)
    const { error } = await upsertCategoryMeta({
      category: slug,
      iconName: newCategoryForm.iconName,
      themePreset: newCategoryForm.themePreset,
      labelTr: newCategoryForm.labelTr.trim() || capitalizeCategoryLabel(slug),
    })
    setCategorySaving(false)
    if (error) {
      showToast('Kategori eklenemedi: ' + error.message, 'error')
      return
    }
    showToast('Kategori eklendi.', 'success')
    setNewCategoryForm({ slug: '', labelTr: '', iconName: '', themePreset: '' })
    setShowAddModal(false)
    fetchCategories()
  }

  async function saveEditCategory() {
    if (!editCategoryModal) return
    if (!editCategoryModal.iconName || !editCategoryModal.themePreset) {
      showToast('İkon ve renk teması zorunludur.', 'error')
      return
    }
    setCategorySaving(true)
    const { error } = await upsertCategoryMeta({
      category: editCategoryModal.category,
      iconName: editCategoryModal.iconName,
      themePreset: editCategoryModal.themePreset,
      labelTr: editCategoryModal.labelTr.trim() || capitalizeCategoryLabel(editCategoryModal.category),
    })
    setCategorySaving(false)
    if (error) {
      showToast('Kategori güncellenemedi: ' + error.message, 'error')
      return
    }
    showToast('Kategori güncellendi.', 'success')
    setEditCategoryModal(null)
    fetchCategories()
  }

  function openCategoryDeleteConfirm(category) {
    const key = normalizeCategory(category)
    const matchKeys = getCategoryMatchKeys(key, categoryMetaMap)
    const wordCount = vocab.filter((w) => matchKeys.has(normalizeCategory(w.category))).length
    const quizCount = quizzes.filter((q) => matchKeys.has(normalizeCategory(q.category))).length
    setCategoryDeleteTarget({
      category: key,
      label: getCategoryLabel(key, categoryMetaMap),
      wordCount,
      quizCount,
    })
  }

  async function confirmCategoryDelete() {
    if (!categoryDeleteTarget) return
    setCategorySaving(true)
    const { category } = categoryDeleteTarget

    const { error: contentError, wordsDeleted, quizzesDeleted } = await deleteCategoryContent(
      category,
      categoryMetaMap,
    )
    if (contentError) {
      setCategorySaving(false)
      showToast('İçerik silinemedi: ' + contentError.message, 'error')
      return
    }

    const { error: metaError } = await deleteCategoryMeta(category)
    setCategorySaving(false)
    if (metaError) {
      showToast('Kategori meta silinemedi: ' + metaError.message, 'error')
      return
    }

    const parts = []
    if (wordsDeleted > 0) parts.push(`${wordsDeleted} kelime`)
    if (quizzesDeleted > 0) parts.push(`${quizzesDeleted} quiz`)
    const detail = parts.length ? ` (${parts.join(', ')} silindi)` : ''
    showToast(`'${categoryDeleteTarget.label}' kategorisi silindi${detail}.`, 'success')
    setCategoryDeleteTarget(null)
    fetchData()
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    const { data, error } = await supabase
      .from('admin_user_list')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      showToast('Kullanıcılar yüklenemedi: ' + error.message, 'error')
    } else {
      setUsers(data || [])
    }
    setUsersLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = useCallback(async () => {
    const [{ data: wordRows }, { data: quizRows }, meta] = await Promise.all([
      supabase
        .from('vocabulary_games')
        .select('category')
        .not('category', 'is', null),
      supabase
        .from('custom_quizzes')
        .select('category')
        .not('category', 'is', null),
      fetchCategoryMeta(),
    ])

    setCategoryMeta(meta)
    setCategoryMetaCache(meta)

    const dbCategories = [
      ...(wordRows ?? []).map((d) => d.category),
      ...(quizRows ?? []).map((d) => d.category),
    ].filter(Boolean)
    setExistingCategories(mergeWithKnownCategories(dbCategories, meta))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: mods }, voc, quizzesData] = await Promise.all([
        supabase.from('modules').select('*').order('order_index', { ascending: true }),
        fetchPaginatedRows((from, to) =>
          supabase
            .from('vocabulary_games')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to),
        ),
        fetchPaginatedRows((from, to) =>
          supabase
            .from('custom_quizzes')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to),
        ),
      ])
      setModules(mods ?? [])
      setVocab(voc)
      setQuizzes(quizzesData)
    } catch (err) {
      showToast('Veriler yüklenemedi: ' + err.message, 'error')
    }
    setLoading(false)
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (mainTab === 'users') fetchUsers()
  }, [mainTab, fetchUsers])

  useEffect(() => {
    setUserPage(1)
  }, [debouncedUserSearch])

  useEffect(() => {
    setWordPage(1)
  }, [debouncedSearch, diffFilter, categoryFilter, contentTab])

  // ─── Filtered lists ────────────────────────────────────────────────────────────
  const q = debouncedSearch.toLowerCase()

  const filteredModules = modules.filter((m) => {
    const matchSearch = !q || m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    const matchType = !typeFilter || typeFilter === 'all' || m.type === typeFilter
    const matchDiff = !diffFilter || diffFilter === 'all' || m.difficulty === diffFilter
    const matchPub =
      publishFilter === 'all' ||
      (publishFilter === 'published' ? m.is_published : !m.is_published)
    return matchSearch && matchType && matchDiff && matchPub
  })

  const filteredWords = vocab.filter((w) => {
    const matchSearch = !q || w.word?.toLowerCase().includes(q) || w.meaning?.toLowerCase().includes(q)
    const matchDiff = !diffFilter || diffFilter === 'all' || w.difficulty === diffFilter
    const matchCat = categoryFilter === 'all' || normalizeCategory(w.category) === normalizeCategory(categoryFilter)
    return matchSearch && matchDiff && matchCat
  })

  const filteredQuizzes = quizzes.filter((qz) => {
    const matchSearch = !q || qz.question_text?.toLowerCase().includes(q) || qz.category?.toLowerCase().includes(q)
    const matchDiff = !diffFilter || diffFilter === 'all' || qz.difficulty === diffFilter
    const matchCat = categoryFilter === 'all' || normalizeCategory(qz.category) === normalizeCategory(categoryFilter)
    return matchSearch && matchDiff && matchCat
  })

  const filteredUsers = users.filter((u) => {
    if (!debouncedUserSearch) return true
    const uq = debouncedUserSearch.toLowerCase()
    return (
      u.username?.toLowerCase().includes(uq) ||
      u.email?.toLowerCase().includes(uq) ||
      u.full_name?.toLowerCase().includes(uq)
    )
  })

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))
  const safeUserPage = Math.min(userPage, totalUserPages)
  const paginatedUsers = filteredUsers.slice(
    (safeUserPage - 1) * USERS_PER_PAGE,
    safeUserPage * USERS_PER_PAGE
  )

  const totalWordPages = Math.max(1, Math.ceil(filteredWords.length / VOCAB_PER_PAGE))
  const safeWordPage = Math.min(wordPage, totalWordPages)
  const paginatedWords = filteredWords.slice(
    (safeWordPage - 1) * VOCAB_PER_PAGE,
    safeWordPage * VOCAB_PER_PAGE
  )

  const contentTabLabels = {
    modules: 'Modüller',
    words: 'Kelimeler',
    quizzes: 'Quizler',
    categories: 'Kategoriler',
  }

  const addModalTitles = {
    modules: 'Yeni Modül Ekle',
    words: 'Yeni Kelime Ekle',
    quizzes: 'Yeni Quiz Ekle',
    categories: 'Yeni Kategori Ekle',
  }

  function openAddModal() {
    if (contentTab === 'modules') {
      setAddType('reading')
      setModuleForm(emptyModuleForm)
      setAudioFile(null)
      setAddListeningQuestions([])
    } else if (contentTab === 'words') {
      setVocabForm(emptyVocabForm)
    } else if (contentTab === 'quizzes') {
      setNewQuizForm({
        category: '',
        difficulty: 'beginner',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
      })
    } else if (contentTab === 'categories') {
      setNewCategoryForm({ slug: '', labelTr: '', iconName: '', themePreset: '' })
    }
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setAudioFile(null)
  }

  // ─── Toggle admin role ─────────────────────────────────────────────────────────
  async function toggleAdminRole(targetUser) {
    if (targetUser.id === user?.id) {
      showToast('Kendi yetkinizi değiştiremezsiniz.', 'error')
      return
    }
    const newRole = !targetUser.is_admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newRole })
      .eq('id', targetUser.id)
    if (error) {
      showToast('Rol güncellenemedi: ' + error.message, 'error')
    } else {
      showToast(
        newRole
          ? `${targetUser.username} admin yapıldı.`
          : `${targetUser.username} üye yapıldı.`,
        'success'
      )
      fetchUsers()
    }
  }

  // ─── Toggle published ──────────────────────────────────────────────────────────
  async function togglePublished(mod) {
    const { error } = await supabase
      .from('modules')
      .update({ is_published: !mod.is_published })
      .eq('id', mod.id)
    if (error) {
      showToast('Güncelleme başarısız: ' + error.message, 'error')
      return
    }
    showToast('Yayın durumu güncellendi', 'success')
    fetchData()
  }

  // ─── Delete ────────────────────────────────────────────────────────────────────
  function openDeleteConfirm(item, kind) {
    const name = kind === 'quiz'
      ? (item.question_text?.slice(0, 40) + (item.question_text?.length > 40 ? '…' : ''))
      : kind === 'user'
      ? (item.username || item.email || 'Bu kullanıcı')
      : (item.title ?? item.word ?? item.question_text ?? 'Bu öğe')
    setDeleteTarget({ kind, id: item.id, name })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    if (deleteTarget.kind === 'user') {
      // Deletes from profiles table (cascades to user_progress).
      // Note: auth.users record is NOT removed - only the profile row is deleted.
      const { error, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('id', deleteTarget.id)
      setDeleting(false)
      if (error) {
        showToast('Kullanıcı silinemedi: ' + error.message, 'error')
        setDeleteTarget(null)
      } else if (count === 0) {
        showToast('Kullanıcı silinemedi: Yetki hatası.', 'error')
        setDeleteTarget(null)
      } else {
        showToast('Kullanıcı başarıyla silindi.', 'success')
        fetchUsers()
        setDeleteTarget(null)
      }
      return
    }

    let table = 'modules'
    if (deleteTarget.kind === 'vocab') table = 'vocabulary_games'
    else if (deleteTarget.kind === 'quiz') table = 'custom_quizzes'

    if (deleteTarget.kind === 'module') {
      await supabase.from('collection_items').delete().eq('content_id', deleteTarget.id)
    }

    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { showToast('Silme başarısız', 'error'); setDeleteTarget(null); return }
    showToast(`'${deleteTarget.name}' silindi`)
    setDeleteTarget(null)
    fetchData()
  }

  // ─── Edit ──────────────────────────────────────────────────────────────────────
  async function openEdit(kind, data) {
    setEditItem({ kind, data })
    setEditForm({ ...data })
    setEditAudioFile(null)
    if (kind === 'module' && data.type === 'listening') {
      try {
        const qs = await fetchListeningQuestions(data.id)
        setEditListeningQuestions(
          qs.length > 0
            ? qs.map((q) => ({ statement: q.statement, correct_answer: q.correct_answer }))
            : [emptyListeningQuestion()]
        )
      } catch {
        setEditListeningQuestions([emptyListeningQuestion()])
      }
    } else {
      setEditListeningQuestions([])
    }
  }

  async function saveEdit() {
    if (!editItem) return
    setEditSaving(true)
    const table = editItem.kind === 'module' ? 'modules' : 'vocabulary_games'
    let updatedForm = { ...editForm }

    if (editItem.kind === 'module' && editItem.data.type === 'listening' && editAudioFile) {
      try {
        const newUrl = await uploadAudioFile(editAudioFile)
        deleteAudioFile(editItem.data.audio_url)
        updatedForm = { ...updatedForm, audio_url: newUrl }
      } catch (uploadErr) {
        showToast('Ses dosyası yüklenemedi: ' + uploadErr.message, 'error')
        setEditSaving(false)
        return
      }
    }

    if (editItem.kind === 'vocab') {
      if (!editForm.category?.trim()) {
        showToast('Kategori seçmelisiniz.', 'error')
        setEditSaving(false)
        return
      }
      updatedForm = { ...updatedForm, category: normalizeCategory(updatedForm.category) }
    }

    const { error } = await supabase.from(table).update(updatedForm).eq('id', editItem.data.id)
    if (error) {
      setEditSaving(false)
      showToast('Kaydetme başarısız', 'error')
      return
    }

    if (editItem.kind === 'module' && editItem.data.type === 'listening') {
      try {
        await saveListeningQuestions(editItem.data.id, editListeningQuestions)
      } catch (qErr) {
        setEditSaving(false)
        showToast('Sorular kaydedilemedi: ' + qErr.message, 'error')
        return
      }
    }

    setEditSaving(false)
    showToast('Kaydedildi')
    setEditItem(null)
    setEditAudioFile(null)
    setEditListeningQuestions([])
    fetchData()
  }

  // ─── Add new ────────────────────────────────────────────────────────────────────
  async function handleAddSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    if (contentTab === 'quizzes') {
      if (!newQuizForm.category || !newQuizForm.question_text || !newQuizForm.option_a || !newQuizForm.option_b || !newQuizForm.option_c || !newQuizForm.option_d) {
        showToast('Lütfen tüm zorunlu alanları doldurun.', 'error')
        setSubmitting(false)
        return
      }
      const { error } = await supabase.from('custom_quizzes').insert({
        ...newQuizForm,
        category: normalizeCategory(newQuizForm.category),
      })
      if (error) {
        showToast('Soru eklenemedi: ' + error.message, 'error')
      } else {
        showToast('Soru başarıyla eklendi!', 'success')
        setNewQuizForm({ category: '', difficulty: 'beginner', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
        setShowAddModal(false)
      }
      setSubmitting(false)
      fetchData()
      return
    } else if (contentTab === 'words') {
      if (!vocabForm.category.trim()) {
        showToast('Kategori alanı zorunludur.', 'error')
        setSubmitting(false)
        return
      }
      if (!vocabForm.difficulty) {
        showToast('Zorluk seviyesi seçilmelidir.', 'error')
        setSubmitting(false)
        return
      }
      const normalizedCategory = normalizeCategory(vocabForm.category)
      const payload = { ...vocabForm, category: normalizedCategory }
      const { error } = await supabase.from('vocabulary_games').insert(payload)
      if (error) { showToast('Eklenemedi: ' + error.message, 'error') }
      else { showToast('Kelime eklendi'); setVocabForm(emptyVocabForm); setShowAddModal(false) }
    } else {
      let payload = { ...moduleForm, type: addType === 'reading' ? 'reading' : 'listening' }

      if (addType === 'listening' && audioFile) {
        setAudioUploading(true)
        try {
          const publicUrl = await uploadAudioFile(audioFile)
          payload = { ...payload, audio_url: publicUrl }
        } catch (uploadErr) {
          showToast('Ses dosyası yüklenemedi: ' + uploadErr.message, 'error')
          setAudioUploading(false)
          setSubmitting(false)
          return
        }
        setAudioUploading(false)
      }

      const { data: inserted, error } = await supabase.from('modules').insert(payload).select('id').single()
      if (error) { showToast('Eklenemedi: ' + error.message, 'error') }
      else {
        if (addType === 'listening' && addListeningQuestions.some((q) => q.statement?.trim())) {
          try {
            await saveListeningQuestions(inserted.id, addListeningQuestions)
          } catch (qErr) {
            showToast('Modül eklendi ancak sorular kaydedilemedi: ' + qErr.message, 'error')
            setSubmitting(false)
            fetchData()
            return
          }
        }
        showToast('Modül eklendi')
        setModuleForm({ ...emptyModuleForm, xp_reward: addType === 'reading' ? 30 : 25 })
        setAudioFile(null)
        setAddListeningQuestions([])
        setShowAddModal(false)
      }
    }

    setSubmitting(false)
    fetchData()
  }

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-slate-50 ${DARK_SURFACE}`}>

      {/* ── Header ── */}
      <div className={`bg-white ${DARK_CARD} border-b border-slate-200 ${DARK_BORDER} px-6 py-4 sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
          >
            <span>←</span>
            <span>Ana Sayfaya Dön</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Paneli</h1>
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
          </div>
        </div>
      </div>

      {/* ── Main Tab Bar ── */}
      <div className={`flex border-b border-slate-200 ${DARK_BORDER} bg-white ${DARK_CARD}`}>
        {[
          { key: 'content', label: 'İçerik' },
          { key: 'users', label: 'Kullanıcılar' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setMainTab(tab.key); setShowAddModal(false) }}
            className={`px-6 py-3.5 text-sm font-medium border-b-2 ${
              mainTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ══════════════ CONTENT MANAGEMENT ══════════════ */}
        {mainTab === 'content' && (
          <div className="space-y-4 w-full">

              {/* Sub-tab bar */}
              <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl">
                {[
                  { key: 'modules', label: 'Modüller', count: modules.length },
                  { key: 'words', label: 'Kelimeler', count: vocab.length },
                  { key: 'quizzes', label: 'Quizler', count: quizzes.length },
                  { key: 'categories', label: 'Kategoriler', count: existingCategories.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setContentTab(tab.key); setCategoryFilter('all'); setShowAddModal(false) }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                      contentTab === tab.key
                        ? 'bg-white dark:bg-neutral-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
                  </button>
                ))}
              </div>

              {/* Tab header */}
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {contentTabLabels[contentTab]}
                </h2>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  + Ekle
                </button>
              </div>

              {/* Search & Filter bar - hidden on categories tab */}
              {contentTab !== 'categories' && (
              <div className={`bg-white ${DARK_CARD} rounded-2xl border border-slate-200 ${DARK_BORDER} p-4`}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500">🔍</span>
                    <input
                      type="text"
                      placeholder="Ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>

                  {/* Type filter - only for modules */}
                  {contentTab === 'modules' && (
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className={`${inputCls} sm:w-40`}
                    >
                      <option value="all">Tüm Türler</option>
                      <option value="reading">Okuma</option>
                      <option value="listening">Dinleme</option>
                    </select>
                  )}

                  {/* Category filter - only for words and quizzes */}
                  {(contentTab === 'words' || contentTab === 'quizzes') && (
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className={`${inputCls} sm:w-44`}
                    >
                      <option value="all">Tüm Kategoriler</option>
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat, categoryMetaMap)}</option>
                      ))}
                    </select>
                  )}

                  {/* Difficulty filter - all tabs */}
                  <select
                    value={diffFilter}
                    onChange={(e) => setDiffFilter(e.target.value)}
                    className={`${inputCls} sm:w-44`}
                  >
                    <option value="">Tüm Zorluklar</option>
                    <option value="beginner">Başlangıç</option>
                    <option value="intermediate">Orta</option>
                    <option value="advanced">İleri</option>
                  </select>

                  {/* Publish filter - only for modules */}
                  {contentTab === 'modules' && (
                    <select
                      value={publishFilter}
                      onChange={(e) => setPublishFilter(e.target.value)}
                      className={`${inputCls} sm:w-40`}
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="published">Yayında</option>
                      <option value="draft">Taslak</option>
                    </select>
                  )}
                </div>
              </div>
              )}

              {/* Content list */}
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : contentTab === 'modules' ? (
                <div className="space-y-3">
                  {filteredModules.length === 0 && (
                    <EmptyState message="Modül bulunamadı." icon="🔍" />
                  )}
                  {filteredModules.map((mod) => (
                    <div key={mod.id} className={`bg-white ${DARK_CARD} rounded-xl border border-slate-200 ${DARK_BORDER} p-4 flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge[mod.type] ?? 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300'}`}>
                          {getModuleTypeLabel(mod.type)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{mod.title}</p>
                          {mod.difficulty && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(mod.difficulty)}`}>
                              {getDifficultyLabel(mod.difficulty)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => togglePublished(mod)}
                          title={mod.is_published ? 'Yayında - kaldırmak için tıkla' : 'Taslak - yayınlamak için tıkla'}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                            mod.is_published
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {mod.is_published ? 'Yayında' : 'Taslak'}
                        </button>
                        <button
                          onClick={() => openEdit('module', mod)}
                          className={editBtnCls}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(mod, 'module')}
                          className={deleteBtnCls}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : contentTab === 'categories' ? (
                <div className="space-y-4">
                  {existingCategories.length === 0 && !loading && (
                    <EmptyState message="Henüz kategori yok." icon="🏷️" />
                  )}
                  {existingCategories.length > 0 && (
                  <div className={`overflow-x-auto rounded-2xl border border-slate-200 ${DARK_BORDER} bg-white ${DARK_CARD}`}>
                    <table className="w-full border-collapse min-w-[720px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-neutral-800">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Türkçe Ad</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">DB Değeri</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">İkon</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Renk</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Kelime</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingCategories.map((cat) => {
                          const theme = getCategoryTheme(cat, categoryMetaMap)
                          const Icon = theme.Icon
                          const meta = categoryMetaMap[cat]
                          const preset = meta?.theme_preset ? getThemePresetById(meta.theme_preset) : null
                          const wordCount = categoryWordCounts[cat] || 0
                          return (
                            <tr key={cat} className="border-b border-slate-100 dark:border-neutral-800/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-neutral-800/40">
                              <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                                {getCategoryLabel(cat, categoryMetaMap)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-mono">{cat}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${theme.accentBgClass}`}>
                                  <Icon className={`w-5 h-5 ${theme.iconTextClass}`} strokeWidth={2} />
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {preset ? (
                                  <span className={`inline-block w-7 h-7 rounded-full ${preset.swatchClass}`} title={preset.label} />
                                ) : (
                                  <span className={`inline-block w-7 h-7 rounded-full ${theme.accentBgClass} ring-1 ring-slate-200 dark:ring-neutral-700`} title="Varsayılan tema" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm tabular-nums text-slate-700 dark:text-slate-300">{wordCount}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <button type="button" onClick={() => openEditCategory(cat)} className={editBtnCls}>
                                    Düzenle
                                  </button>
                                  <button type="button" onClick={() => openCategoryDeleteConfirm(cat)} className={deleteBtnCls}>
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              ) : contentTab === 'words' ? (
                <div className="space-y-3">
                  {filteredWords.length === 0 && (
                    <EmptyState message="Kelime bulunamadı." icon="📝" />
                  )}
                  {paginatedWords.map((v) => (
                    <div key={v.id} className={`bg-white ${DARK_CARD} rounded-xl border border-slate-200 ${DARK_BORDER} p-4 flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {v.association_color && (
                          <span className={`shrink-0 w-3 h-3 rounded-full ${colorDot[v.association_color] ?? 'bg-slate-300'}`} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{v.word}</p>
                            {v.category && (
                              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{getCategoryLabel(v.category, categoryMetaMap)}</span>
                            )}
                            {v.difficulty && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getDifficultyColor(v.difficulty)}`}>
                                {getDifficultyLabel(v.difficulty)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{v.meaning}</p>
                        </div>
                        {v.association_group && (
                          <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                            {v.association_group}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEdit('vocab', v)}
                          className={editBtnCls}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(v, 'vocab')}
                          className={deleteBtnCls}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}

                  {!loading && filteredWords.length > 0 && (
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                        Sayfa {safeWordPage} / {totalWordPages}
                        <span className="ml-2">({filteredWords.length} kelime)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setWordPage((p) => Math.max(1, p - 1))}
                        disabled={safeWordPage === 1}
                        className={`${cancelBtnCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        Önceki
                      </button>
                      <button
                        type="button"
                        onClick={() => setWordPage((p) => Math.min(totalWordPages, p + 1))}
                        disabled={safeWordPage === totalWordPages}
                        className={`${cancelBtnCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        Sonraki
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Quizzes */
                <div className="space-y-3">
                  {filteredQuizzes.length === 0 && (
                    <EmptyState message="Quiz bulunamadı." icon="📋" />
                  )}
                  {filteredQuizzes.map((qz) => (
                    <div key={qz.id} className={`bg-white ${DARK_CARD} rounded-xl border border-slate-200 ${DARK_BORDER} p-4 flex items-center justify-between gap-4`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">{getCategoryLabel(qz.category, categoryMetaMap)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(qz.difficulty)}`}>{getDifficultyLabel(qz.difficulty)}</span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">{qz.question_text}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Doğru: Şık {qz.correct_option}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setEditQuizForm({...qz}); setShowEditQuizModal(true) }}
                          className={`${editBtnCls} flex-shrink-0`}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(qz, 'quiz')}
                          className={`${deleteBtnCls} flex-shrink-0`}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══════════════ USERS ══════════════ */}
        {mainTab === 'users' && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kullanıcı Listesi</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">{users.length} kullanıcı</span>
            </div>

            {/* User search */}
            <input
              type="text"
              placeholder="Kullanıcı ara (isim veya e-posta)..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className={inputCls}
            />

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState message="Kullanıcı bulunamadı." icon="👤" />
            ) : (
              <div className={`overflow-x-auto rounded-xl border border-slate-200 ${DARK_BORDER} bg-white ${DARK_CARD}`}>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[420px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[96px]" />
                    <col className="w-[110px]" />
                    <col />
                    <col className="w-[220px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-neutral-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Kullanıcı</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">XP</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Seviye</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Tamamlanan</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Kayıt</th>
                      <th aria-hidden="true" className="p-0" />
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-100 dark:border-neutral-800/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0">
                              {(u.username || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{u.username || 'İsimsiz'}</span>
                                {u.is_admin && (
                                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium shrink-0">Admin</span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 break-all">
                                {u.email || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center align-middle">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tabular-nums">{u.total_xp || 0}</span>
                        </td>
                        <td className="px-2 py-3 text-center align-middle">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tabular-nums">Sv. {u.level || 1}</span>
                        </td>
                        <td className="px-2 py-3 text-center align-middle">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tabular-nums">{u.completed_modules || 0}</span>
                        </td>
                        <td className="px-2 py-3 text-center align-middle">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'}
                          </span>
                        </td>
                        <td aria-hidden="true" className="p-0" />
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                            <button
                              onClick={() => toggleAdminRole(u)}
                              disabled={u.id === user?.id}
                              className={`shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                                u.id === user?.id
                                  ? 'text-slate-300 dark:text-neutral-600 border-slate-100 dark:border-neutral-800 cursor-not-allowed'
                                  : u.is_admin
                                  ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800'
                                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {u.id === user?.id ? 'Sen' : u.is_admin ? 'Üye Yap' : 'Admin Yap'}
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(u, 'user')}
                              disabled={u.id === user?.id}
                              className={`${deleteBtnCls} shrink-0 disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                              Kaydı Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!usersLoading && filteredUsers.length > 0 && (
              <div className="flex items-center justify-end gap-3 pt-3">
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  Sayfa {safeUserPage} / {totalUserPages}
                </span>
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={safeUserPage === 1}
                  className={`${cancelBtnCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Önceki
                </button>
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  disabled={safeUserPage === totalUserPages}
                  className={`${cancelBtnCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Content Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white ${DARK_CARD} rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b border-slate-100 ${DARK_BORDER} flex items-center justify-between`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {addModalTitles[contentTab]}
              </h3>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            {contentTab === 'categories' ? (
              <form onSubmit={handleAddCategory} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="DB kodu">
                    <input
                      required
                      className={inputCls}
                      value={newCategoryForm.slug}
                      onChange={(e) => setNewCategoryForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
                      placeholder="örn: gaming, seyahat"
                    />
                  </Field>
                  <Field label="Türkçe ad (label_tr)">
                    <input
                      className={inputCls}
                      value={newCategoryForm.labelTr}
                      onChange={(e) => setNewCategoryForm((p) => ({ ...p, labelTr: e.target.value }))}
                      placeholder="örn: Oyun"
                    />
                  </Field>
                </div>
                <CategoryIconPicker
                  value={newCategoryForm.iconName}
                  onChange={(iconName) => setNewCategoryForm((p) => ({ ...p, iconName }))}
                  themeValue={newCategoryForm.themePreset}
                  onThemeChange={(themePreset) => setNewCategoryForm((p) => ({ ...p, themePreset }))}
                />
                <div className={`flex gap-3 justify-end pt-2 border-t border-slate-100 ${DARK_BORDER}`}>
                  <button type="button" onClick={closeAddModal} className={cancelBtnCls}>
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={categorySaving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {categorySaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {contentTab === 'modules' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[['reading', 'Okuma'], ['listening', 'Dinleme']].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setAddType(key)
                          setModuleForm((p) => ({ ...p, xp_reward: key === 'reading' ? 30 : 25 }))
                          if (key === 'listening') {
                            setAddListeningQuestions([emptyListeningQuestion()])
                          } else {
                            setAddListeningQuestions([])
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold border ${
                          addType === key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : `bg-white ${DARK_CARD} text-slate-600 dark:text-slate-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800`
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {contentTab === 'quizzes' ? (
                  <>
                    <div>
                      <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
                      <select
                        value={newQuizForm.category}
                        onChange={e => setNewQuizForm(p => ({ ...p, category: e.target.value }))}
                        required
                        className={inputCls}
                      >
                        <option value="">Kategori seç</option>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>{getCategoryLabel(cat, categoryMetaMap)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Zorluk <span className="text-red-500">*</span></label>
                      <select
                        value={newQuizForm.difficulty}
                        onChange={e => setNewQuizForm(p => ({ ...p, difficulty: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="beginner">Başlangıç</option>
                        <option value="intermediate">Orta</option>
                        <option value="advanced">İleri</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Soru Metni <span className="text-red-500">*</span></label>
                      <textarea
                        value={newQuizForm.question_text}
                        onChange={e => setNewQuizForm(p => ({ ...p, question_text: e.target.value }))}
                        placeholder="Örn: My gaming ___ is very ergonomic."
                        rows={2}
                        required
                        className={inputCls}
                      />
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Boşluk için ___ (üç alt çizgi) kullanın</p>
                    </div>
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt}>
                        <label className={labelCls}>Şık {opt.toUpperCase()} <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={newQuizForm[`option_${opt}`]}
                          onChange={e => setNewQuizForm(p => ({ ...p, [`option_${opt}`]: e.target.value }))}
                          placeholder={`Şık ${opt.toUpperCase()}...`}
                          required
                          className={inputCls}
                        />
                      </div>
                    ))}
                    <div>
                      <label className={labelCls}>Doğru Cevap <span className="text-red-500">*</span></label>
                      <select
                        value={newQuizForm.correct_option}
                        onChange={e => setNewQuizForm(p => ({ ...p, correct_option: e.target.value }))}
                        className={inputCls}
                      >
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <option key={opt} value={opt}>Şık {opt}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : contentTab === 'words' ? (
                  <>
                    <Field label="Kelime">
                      <input required className={inputCls} value={vocabForm.word} onChange={(e) => setVocabForm({ ...vocabForm, word: e.target.value })} />
                    </Field>
                    <Field label="Anlam">
                      <input required className={inputCls} value={vocabForm.meaning} onChange={(e) => setVocabForm({ ...vocabForm, meaning: e.target.value })} />
                    </Field>
                    <div>
                      <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
                      <select
                        required
                        className={inputCls}
                        value={vocabForm.category}
                        onChange={(e) => setVocabForm({ ...vocabForm, category: e.target.value })}
                      >
                        <option value="">Kategori seç</option>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>{getCategoryLabel(cat, categoryMetaMap)}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                        Yeni kategori eklemek için Kategoriler sekmesini kullanın.
                      </p>
                    </div>
                    <Field label="Zorluk">
                      <select required className={inputCls} value={vocabForm.difficulty || ''} onChange={(e) => setVocabForm({ ...vocabForm, difficulty: e.target.value })}>
                        <option value="">Seç</option>
                        {DIFFICULTIES.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                      </select>
                    </Field>
                    <Field label="Örnek Cümle">
                      <textarea rows={2} className={inputCls} value={vocabForm.example_sentence} onChange={(e) => setVocabForm({ ...vocabForm, example_sentence: e.target.value })} />
                    </Field>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Örnek Cümle Çevirisi <span className="text-slate-400 dark:text-neutral-500 text-xs">(isteğe bağlı)</span>
                      </label>
                      <textarea
                        value={vocabForm.example_translation || ''}
                        onChange={e => setVocabForm(prev => ({ ...prev, example_translation: e.target.value }))}
                        placeholder="Örnek cümlenin Türkçe çevirisi..."
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Başlık">
                      <input required className={inputCls} value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} />
                    </Field>
                    <Field label="Açıklama">
                      <textarea rows={2} className={inputCls} value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} />
                    </Field>
                    <Field label="Zorluk">
                      <select className={inputCls} value={moduleForm.difficulty} onChange={(e) => setModuleForm({ ...moduleForm, difficulty: e.target.value })}>
                        {DIFFICULTIES.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                      </select>
                    </Field>
                    <Field label={addType === 'reading' ? 'İçerik' : 'Transkript'}>
                      <FormattingTextarea
                        rows={3}
                        className={inputCls}
                        value={moduleForm.content}
                        onChange={(val) => setModuleForm({ ...moduleForm, content: val })}
                      />
                    </Field>
                    {addType === 'listening' && (
                      <>
                        <div>
                          <label className={labelCls}>Ses Dosyası</label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={e => setAudioFile(e.target.files[0] || null)}
                            className={fileInputCls}
                          />
                          {audioFile && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Seçilen: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                        </div>
                        <ListeningQuestionsEditor
                          questions={addListeningQuestions}
                          onChange={setAddListeningQuestions}
                        />
                      </>
                    )}
                    <Field label="XP Ödülü">
                      <input type="number" className={inputCls} value={moduleForm.xp_reward} onChange={(e) => setModuleForm({ ...moduleForm, xp_reward: Number(e.target.value) })} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={moduleForm.is_published} onChange={(e) => setModuleForm({ ...moduleForm, is_published: e.target.checked })} className="rounded border-slate-300 dark:border-neutral-600 dark:bg-neutral-900 text-indigo-600 focus:ring-indigo-500" />
                      Yayınla
                    </label>
                  </>
                )}

                <div className={`flex gap-3 justify-end pt-2 border-t border-slate-100 ${DARK_BORDER}`}>
                  <button type="button" onClick={closeAddModal} className={cancelBtnCls}>
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || audioUploading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {audioUploading ? 'Ses yükleniyor...' : submitting ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Emin misiniz?"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {deleteTarget?.kind === 'user' ? (
            <>
              Bu işlem kullanıcının tüm profil ve ilerleme verilerini siler.{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTarget?.name}</span> hesabı kaldırılacak.
            </>
          ) : (
            <>
              Bu işlem geri alınamaz.{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">&apos;{deleteTarget?.name}&apos;</span> silinecek.
            </>
          )}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteTarget(null)}
            className={cancelBtnCls}
          >
            İptal
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editItem}
        onClose={() => { setEditItem(null); setEditListeningQuestions([]) }}
        title={editItem?.kind === 'module' ? 'Modülü Düzenle' : 'Kelimeyi Düzenle'}
      >
        {editItem && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {editItem.kind === 'module' ? (
              <>
                <Field label="Başlık">
                  <input className={inputCls} value={editForm.title ?? ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </Field>
                <Field label="Açıklama">
                  <textarea rows={2} className={inputCls} value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </Field>
                <Field label="Tür">
                  <p className={`${inputCls} bg-slate-50 dark:bg-neutral-800 cursor-default`}>
                    {getModuleTypeLabel(editForm.type)}
                  </p>
                </Field>
                <Field label="Zorluk">
                  <select className={inputCls} value={editForm.difficulty ?? ''} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}>
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                  </select>
                </Field>
                <Field label="İçerik">
                  {(editForm.type === 'reading' || editForm.type === 'listening') ? (
                    <FormattingTextarea
                      rows={3}
                      className={inputCls}
                      value={editForm.content ?? ''}
                      onChange={(val) => setEditForm({ ...editForm, content: val })}
                    />
                  ) : (
                    <textarea rows={5} className={inputCls} value={editForm.content ?? ''} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
                  )}
                </Field>
                {editForm.type === 'listening' ? (
                  <>
                    <div>
                      <label className={labelCls}>Ses Dosyasını Değiştir (isteğe bağlı)</label>
                      {editForm.audio_url && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Mevcut:{' '}
                          <a href={editForm.audio_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">
                            Ses dosyasını dinle
                          </a>
                        </p>
                      )}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={e => setEditAudioFile(e.target.files[0] || null)}
                        className={fileInputCls}
                      />
                      {editAudioFile && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Seçilen: {editAudioFile.name} ({(editAudioFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    <ListeningQuestionsEditor
                      questions={editListeningQuestions}
                      onChange={setEditListeningQuestions}
                    />
                  </>
                ) : (
                  <Field label="Ses URL">
                    <input className={inputCls} value={editForm.audio_url ?? ''} onChange={(e) => setEditForm({ ...editForm, audio_url: e.target.value })} />
                  </Field>
                )}
                <Field label="XP Ödülü">
                  <input type="number" className={inputCls} value={editForm.xp_reward ?? 0} onChange={(e) => setEditForm({ ...editForm, xp_reward: Number(e.target.value) })} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_published ?? false} onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })} className="rounded border-slate-300 dark:border-neutral-600 dark:bg-neutral-900 text-indigo-600 focus:ring-indigo-500" />
                  Yayınla
                </label>
              </>
            ) : (
              <>
                <Field label="Kelime">
                  <input className={inputCls} value={editForm.word ?? ''} onChange={(e) => setEditForm({ ...editForm, word: e.target.value })} />
                </Field>
                <Field label="Anlam">
                  <input className={inputCls} value={editForm.meaning ?? ''} onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })} />
                </Field>
                <div>
                  <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
                  <select
                    className={inputCls}
                    value={editForm.category ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="">Kategori seç</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryLabel(cat, categoryMetaMap)}</option>
                    ))}
                  </select>
                </div>
                <Field label="Zorluk">
                  <select className={inputCls} value={editForm.difficulty ?? ''} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}>
                    <option value="">Seç</option>
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{getDifficultyLabel(d)}</option>)}
                  </select>
                </Field>
                <Field label="Örnek Cümle">
                  <textarea rows={2} className={inputCls} value={editForm.example_sentence ?? ''} onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })} />
                </Field>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Örnek Cümle Çevirisi <span className="text-slate-400 dark:text-neutral-500 text-xs">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    value={editForm.example_translation || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, example_translation: e.target.value }))}
                    placeholder="Örnek cümlenin Türkçe çevirisi..."
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className={cancelBtnCls}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {editSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Quiz Modal ── */}
      {showEditQuizModal && editQuizForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white ${DARK_CARD} rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b border-slate-100 ${DARK_BORDER}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quiz Düzenle</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Kategori</label>
                <select
                  value={editQuizForm.category}
                  onChange={e => setEditQuizForm(p => ({...p, category: e.target.value}))}
                  className={inputCls}
                >
                  <option value="">Kategori seç</option>
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat, categoryMetaMap)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Zorluk</label>
                <select
                  value={editQuizForm.difficulty}
                  onChange={e => setEditQuizForm(p => ({...p, difficulty: e.target.value}))}
                  className={inputCls}
                >
                  <option value="beginner">Başlangıç</option>
                  <option value="intermediate">Orta</option>
                  <option value="advanced">İleri</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Soru Metni</label>
                <textarea
                  value={editQuizForm.question_text}
                  onChange={e => setEditQuizForm(p => ({...p, question_text: e.target.value}))}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
              {['a','b','c','d'].map(opt => (
                <div key={opt}>
                  <label className={labelCls}>Şık {opt.toUpperCase()}</label>
                  <input
                    type="text"
                    value={editQuizForm[`option_${opt}`]}
                    onChange={e => setEditQuizForm(p => ({...p, [`option_${opt}`]: e.target.value}))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div>
                <label className={labelCls}>Doğru Cevap</label>
                <select
                  value={editQuizForm.correct_option}
                  onChange={e => setEditQuizForm(p => ({...p, correct_option: e.target.value}))}
                  className={inputCls}
                >
                  {['A','B','C','D'].map(opt => <option key={opt} value={opt}>Şık {opt}</option>)}
                </select>
              </div>
            </div>
            <div className={`p-6 border-t border-slate-100 ${DARK_BORDER} flex gap-3 justify-end`}>
              <button
                onClick={() => setShowEditQuizModal(false)}
                className={cancelBtnCls}
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from('custom_quizzes')
                    .update({
                      category: normalizeCategory(editQuizForm.category),
                      difficulty: editQuizForm.difficulty,
                      question_text: editQuizForm.question_text,
                      option_a: editQuizForm.option_a,
                      option_b: editQuizForm.option_b,
                      option_c: editQuizForm.option_c,
                      option_d: editQuizForm.option_d,
                      correct_option: editQuizForm.correct_option,
                    })
                    .eq('id', editQuizForm.id)
                  if (error) {
                    showToast('Güncelleme başarısız: ' + error.message, 'error')
                  } else {
                    showToast('Quiz güncellendi!', 'success')
                    setShowEditQuizModal(false)
                    fetchData()
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Category Modal ── */}
      <Modal
        isOpen={!!editCategoryModal}
        onClose={() => setEditCategoryModal(null)}
        title="Kategoriyi Düzenle"
      >
        {editCategoryModal && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Türkçe ad (label_tr)">
              <input
                className={inputCls}
                value={editCategoryModal.labelTr}
                onChange={(e) => setEditCategoryModal((p) => ({ ...p, labelTr: e.target.value }))}
              />
            </Field>
            <CategoryIconPicker
              mode="edit"
              value={editCategoryModal.iconName}
              onChange={(iconName) => setEditCategoryModal((p) => ({ ...p, iconName }))}
              themeValue={editCategoryModal.themePreset}
              onThemeChange={(themePreset) => setEditCategoryModal((p) => ({ ...p, themePreset }))}
            />
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button type="button" onClick={() => setEditCategoryModal(null)} className={cancelBtnCls}>
                İptal
              </button>
              <button
                type="button"
                onClick={saveEditCategory}
                disabled={categorySaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {categorySaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Category Modal ── */}
      <Modal
        isOpen={!!categoryDeleteTarget}
        onClose={() => setCategoryDeleteTarget(null)}
        title="Kategoriyi sil?"
      >
        {categoryDeleteTarget && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{categoryDeleteTarget.label}</span>
              {' '}({categoryDeleteTarget.category}) kategorisi kalıcı olarak silinecek.
            </p>
            {(categoryDeleteTarget.wordCount > 0 || categoryDeleteTarget.quizCount > 0) && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 mb-4 text-sm text-red-700 dark:text-red-300">
                {categoryDeleteTarget.wordCount > 0 && (
                  <p>Bu kategorideki <strong>{categoryDeleteTarget.wordCount}</strong> kelime silinecek.</p>
                )}
                {categoryDeleteTarget.quizCount > 0 && (
                  <p>Bu kategorideki <strong>{categoryDeleteTarget.quizCount}</strong> quiz sorusu silinecek.</p>
                )}
              </div>
            )}
            {categoryDeleteTarget.wordCount === 0 && categoryDeleteTarget.quizCount === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-3 mb-4">
                Kelime veya quiz yok; yalnızca kategori ayarları (meta) silinir.
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCategoryDeleteTarget(null)} className={cancelBtnCls}>
                İptal
              </button>
              <button
                onClick={confirmCategoryDelete}
                disabled={categorySaving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {categorySaving ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  )
}
