import {
  // Fitness & Health (8 icons)
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  Heart,
  HeartPulse,
  Flame,
  Zap,

  // Mindfulness & Wellness (6 icons)
  Brain,
  Smile,
  Moon,
  Sun,
  Sparkles,
  Wind,

  // Productivity & Learning (8 icons)
  Book,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Target,
  TrendingUp,
  CheckSquare,
  ListChecks,

  // Daily Habits (8 icons)
  Coffee,
  Utensils,
  Droplet,
  Pill,
  Leaf,
  Trees,
  Home,
  Briefcase,

  type LucideIcon,
} from 'lucide-react'

export interface TaskIcon {
  name: string
  icon: LucideIcon
  label: string
  category: 'fitness' | 'wellness' | 'productivity' | 'daily'
}

export const TASK_ICONS: TaskIcon[] = [
  // Fitness & Health
  { name: 'Activity', icon: Activity, label: 'Activiteit', category: 'fitness' },
  { name: 'Flame', icon: Flame, label: 'Hardlopen', category: 'fitness' },
  { name: 'Bike', icon: Bike, label: 'Fietsen', category: 'fitness' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Krachttraining', category: 'fitness' },
  { name: 'Footprints', icon: Footprints, label: 'Wandelen', category: 'fitness' },
  { name: 'Heart', icon: Heart, label: 'Hart', category: 'fitness' },
  { name: 'HeartPulse', icon: HeartPulse, label: 'Cardio', category: 'fitness' },
  { name: 'Zap', icon: Zap, label: 'Energie', category: 'fitness' },

  // Mindfulness & Wellness
  { name: 'Brain', icon: Brain, label: 'Meditatie', category: 'wellness' },
  { name: 'Smile', icon: Smile, label: 'Geluk', category: 'wellness' },
  { name: 'Moon', icon: Moon, label: 'Slapen', category: 'wellness' },
  { name: 'Sun', icon: Sun, label: 'Ochtend', category: 'wellness' },
  { name: 'Sparkles', icon: Sparkles, label: 'Mindfulness', category: 'wellness' },
  { name: 'Wind', icon: Wind, label: 'Ademhaling', category: 'wellness' },

  // Productivity & Learning
  { name: 'Book', icon: Book, label: 'Lezen', category: 'productivity' },
  { name: 'BookOpen', icon: BookOpen, label: 'Studeren', category: 'productivity' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Leren', category: 'productivity' },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Ideeën', category: 'productivity' },
  { name: 'Target', icon: Target, label: 'Doel', category: 'productivity' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Groei', category: 'productivity' },
  { name: 'CheckSquare', icon: CheckSquare, label: 'Taak', category: 'productivity' },
  { name: 'ListChecks', icon: ListChecks, label: 'Checklist', category: 'productivity' },

  // Daily Habits
  { name: 'Coffee', icon: Coffee, label: 'Koffie', category: 'daily' },
  { name: 'Utensils', icon: Utensils, label: 'Eten', category: 'daily' },
  { name: 'Droplet', icon: Droplet, label: 'Water', category: 'daily' },
  { name: 'Pill', icon: Pill, label: 'Medicatie', category: 'daily' },
  { name: 'Leaf', icon: Leaf, label: 'Natuur', category: 'daily' },
  { name: 'Trees', icon: Trees, label: 'Buitenlucht', category: 'daily' },
  { name: 'Home', icon: Home, label: 'Thuis', category: 'daily' },
  { name: 'Briefcase', icon: Briefcase, label: 'Werk', category: 'daily' },
]

export const DEFAULT_ICON = 'CheckSquare'

export function getTaskIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return CheckSquare

  const found = TASK_ICONS.find(i => i.name === iconName)
  return found?.icon ?? CheckSquare
}

export function getIconLabel(iconName: string | null | undefined): string {
  if (!iconName) return 'Taak'

  const found = TASK_ICONS.find(i => i.name === iconName)
  return found?.label ?? 'Taak'
}
