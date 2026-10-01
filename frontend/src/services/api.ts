import axios from 'axios';
import type {
  AuthResponse,
  User,
  Habit,
  HabitCreateInput,
  HabitCompletion,
  HabitHistoryDetail,
  DashboardOverview,
  StatisticsResponse,
  InsightItem,
  CalendarDayData,
  CalendarDayDetail,
  Category
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('habitflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('habitflow_token');
      localStorage.removeItem('habitflow_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string, timezone?: string): Promise<AuthResponse> => {
    const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const res = await apiClient.post<AuthResponse>('/auth/register', { name, email, password, timezone: userTimezone });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { name?: string; avatar?: string; timezone?: string }): Promise<User> => {
    const res = await apiClient.put<User>('/auth/profile', data);
    return res.data;
  },
  changePassword: async (current_password: string, new_password: string): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>('/auth/password', { current_password, new_password });
    return res.data;
  },
  exportData: async (format: 'json' | 'csv' = 'json'): Promise<any> => {
    const res = await apiClient.get(`/auth/export?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return res.data;
  },
  deleteAccount: async (): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>('/auth/account');
    return res.data;
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('habitflow_token');
      localStorage.removeItem('habitflow_user');
    }
  },
};

// Habits endpoints
export const habitService = {
  getHabits: async (params?: { category?: string; search?: string; sort_by?: string; status?: string }): Promise<Habit[]> => {
    const res = await apiClient.get<Habit[]>('/habits', { params });
    return res.data;
  },
  createHabit: async (data: HabitCreateInput): Promise<Habit> => {
    const res = await apiClient.post<Habit>('/habits', data);
    return res.data;
  },
  getHabitById: async (id: number): Promise<Habit> => {
    const res = await apiClient.get<Habit>(`/habits/${id}`);
    return res.data;
  },
  updateHabit: async (id: number, data: Partial<HabitCreateInput>): Promise<Habit> => {
    const res = await apiClient.put<Habit>(`/habits/${id}`, data);
    return res.data;
  },
  deleteHabit: async (id: number): Promise<void> => {
    await apiClient.delete(`/habits/${id}`);
  },
  completeHabit: async (id: number, dateStr: string, value: number = 1, notes?: string): Promise<HabitCompletion> => {
    const res = await apiClient.post<HabitCompletion>(`/habits/${id}/complete`, {
      completion_date: dateStr,
      completed: true,
      value,
      notes,
    });
    return res.data;
  },
  uncompleteHabit: async (id: number, dateStr?: string): Promise<void> => {
    await apiClient.delete(`/habits/${id}/complete`, {
      params: { completion_date: dateStr },
    });
  },
  skipHabit: async (id: number, dateStr: string, notes?: string): Promise<HabitCompletion> => {
    const res = await apiClient.post<HabitCompletion>(`/habits/${id}/skip`, {
      completion_date: dateStr,
      notes,
    });
    return res.data;
  },
  pauseHabit: async (id: number): Promise<Habit> => {
    const res = await apiClient.post<Habit>(`/habits/${id}/pause`);
    return res.data;
  },
  resumeHabit: async (id: number): Promise<Habit> => {
    const res = await apiClient.post<Habit>(`/habits/${id}/resume`);
    return res.data;
  },
  duplicateHabit: async (id: number): Promise<Habit> => {
    const res = await apiClient.post<Habit>(`/habits/${id}/duplicate`);
    return res.data;
  },
  archiveHabit: async (id: number): Promise<Habit> => {
    const res = await apiClient.put<Habit>(`/habits/${id}`, { is_archived: true, is_active: false });
    return res.data;
  },
  getHabitHistory: async (id: number): Promise<HabitCompletion[]> => {
    const res = await apiClient.get<HabitCompletion[]>(`/habits/${id}/history`);
    return res.data;
  },
  getHabitHistoryDetail: async (id: number, days: number = 30): Promise<HabitHistoryDetail> => {
    const res = await apiClient.get<HabitHistoryDetail>(`/habits/${id}/history?days=${days}`);
    return res.data;
  },
};

// Dashboard endpoints
export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const res = await apiClient.get<DashboardOverview>('/dashboard');
    return res.data;
  },
};

// Statistics endpoints
export const statisticsService = {
  getStats: async (range: string = '30d'): Promise<StatisticsResponse> => {
    const res = await apiClient.get<StatisticsResponse>(`/statistics?range=${range}`);
    return res.data;
  },
};

// Calendar endpoints
export const calendarService = {
  getCalendarData: async (year?: number, month?: number): Promise<CalendarDayData[]> => {
    const res = await apiClient.get<CalendarDayData[]>('/calendar', {
      params: { year, month },
    });
    return res.data;
  },
  getDayDetail: async (dateStr: string): Promise<CalendarDayDetail> => {
    const res = await apiClient.get<CalendarDayDetail>(`/calendar/day?date=${dateStr}`);
    return res.data;
  },
};

// Insights endpoints
export const insightsService = {
  getInsights: async (): Promise<InsightItem[]> => {
    const res = await apiClient.get<InsightItem[]>('/insights');
    return res.data;
  },
};

// Categories endpoints
export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },
  createCategory: async (name: string, color: string = '#6366F1', icon: string = 'folder'): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', { name, color, icon });
    return res.data;
  },
};

