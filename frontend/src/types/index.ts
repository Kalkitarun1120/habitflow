export interface User {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  avatar?: string;
  timezone: string;
  google_id?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  auth_provider?: string;
  has_password?: boolean;
  connected_providers?: string[];
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PhoneAuthResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
  needs_registration?: boolean;
  phone_number?: string;
  message?: string;
}

export interface PhoneSendOTPResponse {
  message: string;
  expires_in: number;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface HabitStreak {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_rate: number;
  completed_today: boolean;
  skipped_today?: boolean;
  is_paused?: boolean;
  today_value: number;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  frequency: string;
  target_value: number;
  target_unit: string;
  reminder_time?: string;
  is_active: boolean;
  is_paused?: boolean;
  is_archived?: boolean;
  start_date?: string;
  is_scheduled_today?: boolean;
  created_at: string;
  updated_at: string;
  streak?: HabitStreak;
}

export interface HabitCreateInput {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  frequency?: string;
  target_value?: number;
  target_unit?: string;
  reminder_time?: string;
  is_active?: boolean;
  is_paused?: boolean;
  is_archived?: boolean;
  start_date?: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  user_id: number;
  completion_date: string;
  completed: boolean;
  skipped?: boolean;
  value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitHistoryDay {
  date: string;
  is_scheduled: boolean;
  completed: boolean;
  skipped: boolean;
  value: number;
  notes?: string;
}

export interface HabitHistoryDetail {
  habit_id: number;
  habit_name: string;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_rate: number;
  created_at: string;
  days: HabitHistoryDay[];
}

export interface CalendarDayHabitStatus {
  habit_id: number;
  habit_name: string;
  category: string;
  color: string;
  icon: string;
  is_scheduled: boolean;
  completed: boolean;
  skipped: boolean;
  value: number;
  target_value: number;
  target_unit: string;
}

export interface CalendarDayDetail {
  date: string;
  total_scheduled: number;
  completed_count: number;
  skipped_count: number;
  completion_rate: number;
  habits: CalendarDayHabitStatus[];
}

export interface DashboardOverview {
  greeting: string;
  total_habits: number;
  completed_today: number;
  remaining_today: number;
  today_progress_percent: number;
  current_streak: number;
  longest_streak: number;
  overall_completion_rate: number;
  habits_today: Habit[];
}

export interface DailyCompletionCount {
  date: string;
  day_name: string;
  completed_count: number;
  total_habits: number;
  rate: number;
}

export interface CategoryPerformance {
  category: string;
  habit_count: number;
  completion_rate: number;
  color: string;
}

export interface DayOfWeekPerformance {
  day_name: string;
  scheduled_count: number;
  completed_count: number;
  rate: number;
}

export interface HabitRiskItem {
  habit_id: number;
  habit_name: string;
  category: string;
  color: string;
  icon: string;
  missed_count: number;
  scheduled_count: number;
  risk_level: 'High' | 'Medium' | 'Low';
  message: string;
}

export interface WeeklyReport {
  period_label: string;
  completion_rate: number;
  prev_completion_rate: number;
  rate_change: number;
  best_habit?: string;
  needs_attention_habit?: string;
  current_streak: number;
  best_day?: string;
}

export interface HabitPerformanceItem {
  habit_id: number;
  name: string;
  category: string;
  color: string;
  icon: string;
  completions_count: number;
  total_scheduled: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  last_completed?: string;
}

export interface HabitWeekDayStatus {
  date: string;
  day_name: string;
  day_number: number;
  is_today: boolean;
  is_future: boolean;
  is_scheduled: boolean;
  completed: boolean;
  skipped: boolean;
  value: number;
}

export interface HabitWeekStatus {
  habit_id: number;
  name: string;
  category: string;
  color: string;
  icon: string;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  is_paused: boolean;
  is_scheduled_today: boolean;
  completed_today: boolean;
  skipped_today: boolean;
  days: HabitWeekDayStatus[];
}

export interface WeekCalendarResponse {
  start_date: string;
  end_date: string;
  habits: HabitWeekStatus[];
}

export interface YearCalendarResponse {
  year: number;
  total_checkins: number;
  total_active_days?: number;
  max_streak?: number;
  daily_counts: Record<string, number>;
}

export interface StatisticsResponse {
  total_habits: number;
  active_habits: number;
  total_completions: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  most_consistent_habit?: string;
  most_consistent_habit_rate?: number;
  needs_attention_habit?: string;
  needs_attention_rate?: number;
  most_consistent_day?: string;
  best_time_of_day?: string;
  weekly_chart: DailyCompletionCount[];
  monthly_chart: {
    label: string;
    completed: number;
    expected: number;
    rate: number;
  }[];
  category_performance: CategoryPerformance[];
  day_of_week?: DayOfWeekPerformance[];
  day_of_week_performance?: DayOfWeekPerformance[];
  habits_at_risk?: HabitRiskItem[];
  habit_risks?: HabitRiskItem[];
  habit_performance?: HabitPerformanceItem[];
  weekly_report?: WeeklyReport;
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'tip' | 'achievement';
  icon: string;
}

export interface CalendarDayData {
  date: string;
  is_current_month: boolean;
  is_today: boolean;
  is_future: boolean;
  completed_count: number;
  total_habits: number;
  completion_rate: number;
  status: 'none' | 'partial' | 'complete' | 'missed';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

