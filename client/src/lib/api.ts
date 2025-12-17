import type { Item, Reservation, ActivityLog, Category, Notification } from "@shared/schema";

export type { Item, Reservation, ActivityLog, Category, Notification };

export interface CategoryWithCounts extends Omit<Category, 'subTypes'> {
  subTypes: string[];
  totalCount: number;
  availableCount: number;
  isCustom: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    logout: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  items: {
    getAll: (category?: string, isEquipment?: boolean) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (isEquipment !== undefined) params.append('isEquipment', String(isEquipment));
      const url = params.toString() ? `/api/items?${params.toString()}` : '/api/items';
      console.log('API request URL:', url);
      return fetch(url, {
        credentials: 'include'
      }).then(handleResponse);
    },
    create: async (item: any) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    update: async (id: string, item: any) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  reservations: {
    getAll: async (): Promise<Reservation[]> => {
      const response = await fetch('/api/reservations', { credentials: 'include' });
      return handleResponse(response);
    },
    getByItem: async (itemId: string): Promise<Reservation[]> => {
      const response = await fetch(`/api/reservations/item/${itemId}`, { credentials: 'include' });
      return handleResponse(response);
    },
    create: async (reservation: any) => {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    update: async (id: string, reservation: any) => {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  activityLogs: {
    getAll: async (): Promise<ActivityLog[]> => {
      const response = await fetch('/api/activity-logs', { credentials: 'include' });
      return handleResponse(response);
    }
  },
  categories: {
    getAll: async (isEquipment?: boolean): Promise<CategoryWithCounts[]> => {
      const params = new URLSearchParams();
      if (isEquipment !== undefined) params.append('isEquipment', String(isEquipment));
      const url = params.toString() ? `/api/categories?${params.toString()}` : '/api/categories';
      const response = await fetch(url, { credentials: 'include' });
      return handleResponse(response);
    }
  },
  customCategories: {
    create: async (category: any) => {
      const response = await fetch('/api/custom-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    update: async (id: string, category: any) => {
      const response = await fetch(`/api/custom-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`/api/custom-categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      return handleResponse(response);
    },
    markAsRead: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      return handleResponse(response);
    },
    markAllAsRead: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  qrCodes: {
    getItemQRCode: async (itemId: string): Promise<{ qrCode: string; barcode: string; publicUrl: string }> => {
      const response = await fetch(`/api/items/${itemId}/qrcode`, { credentials: 'include' });
      return handleResponse(response);
    },
    getAllQRCodes: async (): Promise<Array<{ id: string; barcode: string; productName: string; qrCode: string; publicUrl: string }>> => {
      const response = await fetch('/api/qrcodes/all', { credentials: 'include' });
      return handleResponse(response);
    }
  },
  scan: {
    process: async (barcode: string) => {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  users: {
    getAll: async (): Promise<any[]> => {
      const response = await fetch('/api/users', { credentials: 'include' });
      return handleResponse(response);
    },
    create: async (userData: any) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    update: async (id: string, userData: any) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  },
  damageReports: {
    getAll: async (): Promise<any[]> => {
      const response = await fetch('/api/damage-reports', { credentials: 'include' });
      return handleResponse(response);
    },
    create: async (report: any) => {
      const response = await fetch('/api/damage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        credentials: 'include'
      });
      return handleResponse(response);
    },
    resolve: async (id: string, notes: string) => {
      const response = await fetch(`/api/damage-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolutionNotes: notes }),
        credentials: 'include'
      });
      return handleResponse(response);
    }
  }
};