import * as LucideIcons from 'lucide-react'
import {
  Cpu,
  PawPrint,
  Coffee,
  Briefcase,
  UtensilsCrossed,
  GlassWater,
  HeartPulse,
  TreePine,
  Smile,
  GraduationCap,
  Shirt,
  HeartHandshake,
  Languages,
  Home,
  Car,
  Plane,
  Music,
  Gamepad2,
  BookOpen,
  Globe,
  Camera,
  Palette,
  Dumbbell,
  ShoppingBag,
  Wrench,
  Leaf,
  Sun,
  Moon,
} from 'lucide-react'
import { normalizeCategory } from './vocabularyCategories'

const CATEGORY_THEMES = {
  hardware: {
    Icon: Cpu,
    accentBgClass: 'bg-blue-500/10',
    iconTextClass: 'text-blue-600 dark:text-blue-400',
  },
  animals: {
    Icon: PawPrint,
    accentBgClass: 'bg-orange-500/10',
    iconTextClass: 'text-orange-600 dark:text-orange-400',
  },
  'daily life': {
    Icon: Coffee,
    accentBgClass: 'bg-green-500/10',
    iconTextClass: 'text-green-600 dark:text-green-400',
  },
  jobs: {
    Icon: Briefcase,
    accentBgClass: 'bg-pink-500/10',
    iconTextClass: 'text-pink-600 dark:text-pink-400',
  },
  foods: {
    Icon: UtensilsCrossed,
    accentBgClass: 'bg-amber-500/10',
    iconTextClass: 'text-amber-600 dark:text-amber-400',
  },
  drinks: {
    Icon: GlassWater,
    accentBgClass: 'bg-cyan-500/10',
    iconTextClass: 'text-cyan-600 dark:text-cyan-400',
  },
  health: {
    Icon: HeartPulse,
    accentBgClass: 'bg-rose-500/10',
    iconTextClass: 'text-rose-600 dark:text-rose-400',
  },
  nature: {
    Icon: TreePine,
    accentBgClass: 'bg-emerald-500/10',
    iconTextClass: 'text-emerald-600 dark:text-emerald-400',
  },
  emotions: {
    Icon: Smile,
    accentBgClass: 'bg-violet-500/10',
    iconTextClass: 'text-violet-600 dark:text-violet-400',
  },
  education: {
    Icon: GraduationCap,
    accentBgClass: 'bg-indigo-500/10',
    iconTextClass: 'text-indigo-600 dark:text-indigo-400',
  },
  clothes: {
    Icon: Shirt,
    accentBgClass: 'bg-fuchsia-500/10',
    iconTextClass: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  relationships: {
    Icon: HeartHandshake,
    accentBgClass: 'bg-teal-500/10',
    iconTextClass: 'text-teal-600 dark:text-teal-400',
  },
}

export const CURATED_CATEGORY_ICONS = [
  { name: 'Cpu', label: 'Donanım' },
  { name: 'PawPrint', label: 'Hayvan' },
  { name: 'Coffee', label: 'Günlük' },
  { name: 'Briefcase', label: 'Meslek' },
  { name: 'UtensilsCrossed', label: 'Yemek' },
  { name: 'GlassWater', label: 'İçecek' },
  { name: 'HeartPulse', label: 'Sağlık' },
  { name: 'TreePine', label: 'Doğa' },
  { name: 'Smile', label: 'Duygu' },
  { name: 'GraduationCap', label: 'Eğitim' },
  { name: 'Shirt', label: 'Giysi' },
  { name: 'HeartHandshake', label: 'İlişki' },
  { name: 'Home', label: 'Ev' },
  { name: 'Car', label: 'Araç' },
  { name: 'Plane', label: 'Seyahat' },
  { name: 'Music', label: 'Müzik' },
  { name: 'Gamepad2', label: 'Oyun' },
  { name: 'BookOpen', label: 'Kitap' },
  { name: 'Globe', label: 'Dünya' },
  { name: 'Camera', label: 'Fotoğraf' },
  { name: 'Palette', label: 'Sanat' },
  { name: 'Dumbbell', label: 'Spor' },
  { name: 'ShoppingBag', label: 'Alışveriş' },
  { name: 'Wrench', label: 'Araç-Gereç' },
  { name: 'Leaf', label: 'Bitki' },
  { name: 'Sun', label: 'Güneş' },
  { name: 'Moon', label: 'Gece' },
  { name: 'Languages', label: 'Dil' },
]

export const CATEGORY_COLOR_PRESETS = [
  { id: 'blue', label: 'Mavi', accentBgClass: 'bg-blue-500/10', iconTextClass: 'text-blue-600 dark:text-blue-400', swatchClass: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { id: 'orange', label: 'Turuncu', accentBgClass: 'bg-orange-500/10', iconTextClass: 'text-orange-600 dark:text-orange-400', swatchClass: 'bg-gradient-to-br from-orange-400 to-orange-600' },
  { id: 'green', label: 'Yeşil', accentBgClass: 'bg-green-500/10', iconTextClass: 'text-green-600 dark:text-green-400', swatchClass: 'bg-gradient-to-br from-green-400 to-green-600' },
  { id: 'pink', label: 'Pembe', accentBgClass: 'bg-pink-500/10', iconTextClass: 'text-pink-600 dark:text-pink-400', swatchClass: 'bg-gradient-to-br from-pink-400 to-pink-600' },
  { id: 'amber', label: 'Kehribar', accentBgClass: 'bg-amber-500/10', iconTextClass: 'text-amber-600 dark:text-amber-400', swatchClass: 'bg-gradient-to-br from-amber-400 to-amber-600' },
  { id: 'cyan', label: 'Camgöbeği', accentBgClass: 'bg-cyan-500/10', iconTextClass: 'text-cyan-600 dark:text-cyan-400', swatchClass: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
  { id: 'rose', label: 'Gül', accentBgClass: 'bg-rose-500/10', iconTextClass: 'text-rose-600 dark:text-rose-400', swatchClass: 'bg-gradient-to-br from-rose-400 to-rose-600' },
  { id: 'emerald', label: 'Zümrüt', accentBgClass: 'bg-emerald-500/10', iconTextClass: 'text-emerald-600 dark:text-emerald-400', swatchClass: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  { id: 'violet', label: 'Menekşe', accentBgClass: 'bg-violet-500/10', iconTextClass: 'text-violet-600 dark:text-violet-400', swatchClass: 'bg-gradient-to-br from-violet-400 to-violet-600' },
  { id: 'indigo', label: 'İndigo', accentBgClass: 'bg-indigo-500/10', iconTextClass: 'text-indigo-600 dark:text-indigo-400', swatchClass: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
  { id: 'fuchsia', label: 'Fuşya', accentBgClass: 'bg-fuchsia-500/10', iconTextClass: 'text-fuchsia-600 dark:text-fuchsia-400', swatchClass: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600' },
  { id: 'teal', label: 'Deniz', accentBgClass: 'bg-teal-500/10', iconTextClass: 'text-teal-600 dark:text-teal-400', swatchClass: 'bg-gradient-to-br from-teal-400 to-teal-600' },
  { id: 'red', label: 'Kırmızı', accentBgClass: 'bg-red-500/10', iconTextClass: 'text-red-600 dark:text-red-400', swatchClass: 'bg-gradient-to-br from-red-400 to-red-600' },
  { id: 'lime', label: 'Limon', accentBgClass: 'bg-lime-500/10', iconTextClass: 'text-lime-600 dark:text-lime-400', swatchClass: 'bg-gradient-to-br from-lime-400 to-lime-600' },
  { id: 'sky', label: 'Gök Mavisi', accentBgClass: 'bg-sky-500/10', iconTextClass: 'text-sky-600 dark:text-sky-400', swatchClass: 'bg-gradient-to-br from-sky-400 to-sky-600' },
  { id: 'yellow', label: 'Sarı', accentBgClass: 'bg-yellow-500/10', iconTextClass: 'text-yellow-600 dark:text-yellow-400', swatchClass: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
  { id: 'stone', label: 'Taş', accentBgClass: 'bg-stone-500/10', iconTextClass: 'text-stone-600 dark:text-stone-400', swatchClass: 'bg-gradient-to-br from-stone-400 to-stone-600' },
  { id: 'zinc', label: 'Çinko', accentBgClass: 'bg-zinc-500/10', iconTextClass: 'text-zinc-600 dark:text-zinc-400', swatchClass: 'bg-gradient-to-br from-zinc-400 to-zinc-600' },
  { id: 'orange-deep', label: 'Koyu Turuncu', accentBgClass: 'bg-orange-600/10', iconTextClass: 'text-orange-700 dark:text-orange-500', swatchClass: 'bg-gradient-to-br from-orange-600 to-orange-800' },
  { id: 'teal-dark', label: 'Koyu Deniz', accentBgClass: 'bg-teal-600/10', iconTextClass: 'text-teal-700 dark:text-teal-500', swatchClass: 'bg-gradient-to-br from-teal-600 to-teal-800' },
  { id: 'indigo-dark', label: 'Koyu İndigo', accentBgClass: 'bg-indigo-600/10', iconTextClass: 'text-indigo-700 dark:text-indigo-500', swatchClass: 'bg-gradient-to-br from-indigo-600 to-indigo-800' },
  { id: 'slate', label: 'Gri', accentBgClass: 'bg-slate-500/10', iconTextClass: 'text-slate-500 dark:text-slate-400', swatchClass: 'bg-gradient-to-br from-slate-400 to-slate-600' },
  { id: 'pastel-peach', label: 'Şeftali', accentBgClass: 'bg-orange-300/15', iconTextClass: 'text-orange-500 dark:text-orange-400', swatchClass: 'bg-gradient-to-br from-orange-300 to-rose-200' },
  { id: 'soft-lavender', label: 'Lavanta Pastel', accentBgClass: 'bg-violet-300/15', iconTextClass: 'text-violet-500 dark:text-violet-400', swatchClass: 'bg-gradient-to-br from-violet-300 to-purple-200' },
  { id: 'mint-cream', label: 'Nane Krem', accentBgClass: 'bg-emerald-300/15', iconTextClass: 'text-emerald-500 dark:text-emerald-400', swatchClass: 'bg-gradient-to-br from-emerald-300 to-teal-200' },
  { id: 'blush-pink', label: 'Allık', accentBgClass: 'bg-rose-300/15', iconTextClass: 'text-rose-500 dark:text-rose-400', swatchClass: 'bg-gradient-to-br from-rose-300 to-pink-200' },
  { id: 'butter-yellow', label: 'Tereyağı', accentBgClass: 'bg-yellow-300/15', iconTextClass: 'text-yellow-600 dark:text-yellow-400', swatchClass: 'bg-gradient-to-br from-yellow-300 to-amber-200' },
  { id: 'powder-blue', label: 'Pudra Mavi', accentBgClass: 'bg-sky-300/15', iconTextClass: 'text-sky-500 dark:text-sky-400', swatchClass: 'bg-gradient-to-br from-sky-300 to-blue-200' },
  { id: 'sage', label: 'Adaçayı', accentBgClass: 'bg-green-300/15', iconTextClass: 'text-green-600 dark:text-green-400', swatchClass: 'bg-gradient-to-br from-green-300 to-emerald-200' },
  { id: 'coral-soft', label: 'Yumuşak Mercan', accentBgClass: 'bg-orange-300/15', iconTextClass: 'text-orange-500 dark:text-orange-400', swatchClass: 'bg-gradient-to-br from-rose-300 to-orange-200' },
  { id: 'periwinkle', label: 'Menekşe Açık', accentBgClass: 'bg-indigo-300/15', iconTextClass: 'text-indigo-500 dark:text-indigo-400', swatchClass: 'bg-gradient-to-br from-indigo-300 to-violet-200' },
  { id: 'mauve', label: 'Eflatun', accentBgClass: 'bg-fuchsia-300/15', iconTextClass: 'text-fuchsia-500 dark:text-fuchsia-400', swatchClass: 'bg-gradient-to-br from-fuchsia-300 to-purple-200' },
  { id: 'apricot', label: 'Kayısı', accentBgClass: 'bg-amber-300/15', iconTextClass: 'text-amber-600 dark:text-amber-400', swatchClass: 'bg-gradient-to-br from-amber-300 to-orange-200' },
  { id: 'seafoam', label: 'Deniz Köpüğü', accentBgClass: 'bg-teal-300/15', iconTextClass: 'text-teal-500 dark:text-teal-400', swatchClass: 'bg-gradient-to-br from-teal-300 to-cyan-200' },
]

export const DEFAULT_THEME_PRESET_ID = 'slate'

const DEFAULT_THEME = {
  Icon: Languages,
  accentBgClass: 'bg-slate-500/10',
  iconTextClass: 'text-slate-500 dark:text-slate-400',
}

export function getThemePresetById(presetId) {
  return CATEGORY_COLOR_PRESETS.find((p) => p.id === presetId)
    ?? CATEGORY_COLOR_PRESETS.find((p) => p.id === DEFAULT_THEME_PRESET_ID)
}

let categoryMetaCache = {}

export function setCategoryMetaCache(metaList = []) {
  categoryMetaCache = Object.fromEntries(
    metaList.map((row) => [normalizeCategory(row.category), row]),
  )
}

export function getLucideIcon(iconName) {
  return LucideIcons[iconName] || Languages
}

export function getCategoryTheme(categoryName, metaMap = categoryMetaCache) {
  const key = normalizeCategory(categoryName)
  if (CATEGORY_THEMES[key]) return CATEGORY_THEMES[key]

  const meta = metaMap[key]
  if (meta?.icon_name) {
    const preset = meta.theme_preset ? getThemePresetById(meta.theme_preset) : null
    const colors = preset ?? DEFAULT_THEME
    return {
      Icon: getLucideIcon(meta.icon_name),
      accentBgClass: colors.accentBgClass,
      iconTextClass: colors.iconTextClass,
    }
  }

  return DEFAULT_THEME
}
