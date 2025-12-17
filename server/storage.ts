import { type User, type InsertUser, type Item, type Reservation, type InsertReservation, type InsertActivityLog, type ActivityLog, type InsertCategory, type Category, type Notification, type InsertNotification, type InsertDamageReport, type DamageReport, type SystemPermission } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from './db';
import { 
  items, users, reservations, categories, notifications, activityLogs,
  itemEditHistory, reservationStatusHistory, damageReports, systemPermissions,
  type InsertItem, type InsertItemEditHistory, type InsertReservationStatusHistory
} from "@shared/schema";
import { eq, and, gte, lte, or, desc, asc } from 'drizzle-orm';


export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getAllItems(): Promise<Item[]>;
  getItemById(id: string): Promise<Item | undefined>;
  getItemByBarcode(barcode: string): Promise<Item | undefined>;
  getItemsByCategory(categorySubTypes: readonly string[]): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  softDeleteItem(id: string, userId: string): Promise<boolean>;

  getAllReservations(): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  getReservationsByUser(userId: string): Promise<Reservation[]>;
  getReservationsByItem(itemId: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  checkReservationConflict(itemId: string, startDate: Date, returnDate: Date, excludeId?: string): Promise<boolean>;

  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(): Promise<any[]>;
  getActivityLogsByItem(itemId: string): Promise<any[]>;

  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  createItemEditHistory(data: InsertItemEditHistory): Promise<any>;
  getItemEditHistory(itemId: string): Promise<any[]>;
  createReservationStatusHistory(data: InsertReservationStatusHistory): Promise<any>;
  getReservationStatusHistory(reservationId: string): Promise<any[]>;

  createDamageReport(data: InsertDamageReport): Promise<DamageReport>;
  getAllDamageReports(): Promise<any[]>;
  getDamageReportById(id: string): Promise<DamageReport | undefined>;
  updateDamageReport(id: string, data: Partial<InsertDamageReport>): Promise<DamageReport | undefined>;

  getPermission(key: string): Promise<SystemPermission | undefined>;
  getAllPermissions(): Promise<SystemPermission[]>;
  updatePermission(key: string, enabled: boolean): Promise<SystemPermission | undefined>;
}

export class MemStorage implements IStorage {
  constructor() {
  }

  async getUser(id: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await db.query.users.findMany({
      orderBy: [asc(users.name)]
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllItems(): Promise<Item[]> {
    return await db.query.items.findMany({
      orderBy: [asc(items.productName)]
    });
  }

  async getItemById(id: string): Promise<Item | undefined> {
    return await db.query.items.findFirst({
      where: eq(items.id, id)
    });
  }

  async getItemByBarcode(barcode: string): Promise<Item | undefined> {
    return await db.query.items.findFirst({
      where: eq(items.barcode, barcode)
    });
  }

  async getItemsByCategory(categorySubTypes: readonly string[]): Promise<Item[]> {
    const allItems = await db.query.items.findMany();
    return allItems.filter(item => categorySubTypes.includes(item.productType));
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const now = new Date();
    const itemData = {
      ...insertItem,
      status: insertItem.status || 'Available',
      location: insertItem.location || null,
      notes: insertItem.notes || null,
      createdAt: now,
      updatedAt: now
    };

    const [item] = await db.insert(items).values(itemData).returning();
    return item;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    // Clean up empty strings for nullable/date fields - convert to undefined so Drizzle skips them
    const cleanedUpdates: Record<string, any> = {};
    const dateFields = ['maintenanceAvailableDate', 'checkoutDate', 'returnedDate'];
    const nullableFields = ['location', 'notes', 'productNameAr', 'productTypeAr'];
    
    for (const [key, value] of Object.entries(updates)) {
      // Skip empty strings for date and nullable fields completely
      if (value === '' && ([...dateFields, ...nullableFields].includes(key))) {
        // Don't include in cleanedUpdates - this way Drizzle won't try to update it
        continue;
      }
      cleanedUpdates[key] = value;
    }

    const [item] = await db.update(items)
      .set({ ...cleanedUpdates, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return item;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items)
      .where(eq(items.id, id))
      .returning();
    return result.length > 0;
  }

  async softDeleteItem(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(items)
      .where(eq(items.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db.query.reservations.findMany({
      orderBy: [desc(reservations.requestDate)]
    });
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    return await db.query.reservations.findFirst({
      where: eq(reservations.id, id)
    });
  }

  async getReservationsByUser(userId: string): Promise<Reservation[]> {
    return await db.query.reservations.findMany({
      where: eq(reservations.userId, userId)
    });
  }

  async getReservationsByItem(itemId: string): Promise<Reservation[]> {
    return await db.query.reservations.findMany({
      where: eq(reservations.itemId, itemId)
    });
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const now = new Date();
    const reservationData = {
      ...insertReservation,
      status: insertReservation.status || 'pending',
      notes: insertReservation.notes || null,
      requestDate: now,
      approvalDate: null,
      rejectionReason: null,
      itemConditionOnReceive: null,
      itemConditionOnReturn: null
    };

    const [reservation] = await db.insert(reservations).values(reservationData).returning();
    return reservation;
  }

  async updateReservation(id: string, updates: Partial<InsertReservation> & { rejectionReason?: string; itemConditionOnReceive?: string; itemConditionOnReturn?: string }): Promise<Reservation | undefined> {
    const [reservation] = await db.update(reservations)
      .set(updates)
      .where(eq(reservations.id, id))
      .returning();
    return reservation;
  }

  async checkReservationConflict(itemId: string, startDate: Date, returnDate: Date, excludeId?: string): Promise<boolean> {
    const allReservations = await db.query.reservations.findMany({
      where: eq(reservations.itemId, itemId)
    });

    const itemReservations = allReservations.filter(
      res => res.status !== 'rejected' &&
             res.status !== 'completed' &&
             (!excludeId || res.id !== excludeId)
    );

    for (const res of itemReservations) {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.returnDate);

      if (
        (startDate >= resStart && startDate <= resEnd) ||
        (returnDate >= resStart && returnDate <= resEnd) ||
        (startDate <= resStart && returnDate >= resEnd)
      ) {
        return true;
      }
    }

    return false;
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    try {
      const logData = {
        ...data,
        timestamp: new Date()
      };
      const [log] = await db.insert(activityLogs).values(logData).returning();
      return log as ActivityLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      console.error('Activity log data:', data);
      throw error;
    }
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    try {
      return await db.select({
        id: activityLogs.id,
        itemId: activityLogs.itemId,
        itemName: items.productName,
        itemBarcode: items.barcode,
        userId: activityLogs.userId,
        userName: users.name,
        userRole: users.role,
        userDepartment: users.department,
        action: activityLogs.action,
        oldStatus: activityLogs.oldStatus,
        newStatus: activityLogs.newStatus,
        notes: activityLogs.notes,
        timestamp: activityLogs.timestamp,
      })
      .from(activityLogs)
      .leftJoin(items, eq(activityLogs.itemId, items.id))
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.timestamp));
    } catch (error) {
      console.error('Error getting activity logs:', error);
      return [];
    }
  }

  async getActivityLogsByItem(itemId: string): Promise<ActivityLog[]> {
    try {
      return await db.select({
        id: activityLogs.id,
        itemId: activityLogs.itemId,
        userId: activityLogs.userId,
        userName: users.name,
        userRole: users.role,
        userDepartment: users.department,
        action: activityLogs.action,
        oldStatus: activityLogs.oldStatus,
        newStatus: activityLogs.newStatus,
        notes: activityLogs.notes,
        timestamp: activityLogs.timestamp,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.itemId, itemId))
      .orderBy(desc(activityLogs.timestamp));
    } catch (error) {
      console.error('Error getting activity logs by item:', error);
      return [];
    }
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.query.categories.findMany({
      orderBy: [asc(categories.name)]
    });
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return await db.query.categories.findFirst({
      where: eq(categories.id, id)
    });
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = await this.getCategoryById(id);
    if (category && category.isDefault) {
      throw new Error('Cannot edit default categories.');
    }

    const [updatedCategory] = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.getCategoryById(id);
    if (category && category.isDefault) {
      throw new Error('Cannot delete default categories.');
    }
    const result = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return result.length > 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values({
      ...data,
      isRead: data.isRead || 'false'
    }).returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
    });
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: 'true' })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: 'true' })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, 'false')
      ),
    });
    return result.length;
  }

  async createItemEditHistory(data: InsertItemEditHistory): Promise<any> {
    const [history] = await db.insert(itemEditHistory).values(data).returning();
    return history;
  }

  async getItemEditHistory(itemId: string): Promise<any[]> {
    const history = await db.query.itemEditHistory.findMany({
      where: eq(itemEditHistory.itemId, itemId),
      orderBy: [desc(itemEditHistory.timestamp)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return history.map(h => ({
      id: h.id,
      itemId: h.itemId,
      userId: h.userId,
      fieldName: h.fieldName,
      oldValue: h.oldValue,
      newValue: h.newValue,
      timestamp: h.timestamp,
      userName: h.user.name,
      userRole: h.user.role
    }));
  }

  async createReservationStatusHistory(data: InsertReservationStatusHistory): Promise<any> {
    const [history] = await db.insert(reservationStatusHistory).values(data).returning();
    return history;
  }

  async getReservationStatusHistory(reservationId: string): Promise<any[]> {
    const history = await db.query.reservationStatusHistory.findMany({
      where: eq(reservationStatusHistory.reservationId, reservationId),
      orderBy: [desc(reservationStatusHistory.timestamp)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return history.map(h => ({
      id: h.id,
      reservationId: h.reservationId,
      userId: h.userId,
      oldStatus: h.oldStatus,
      newStatus: h.newStatus,
      notes: h.notes,
      timestamp: h.timestamp,
      userName: h.user.name,
      userRole: h.user.role
    }));
  }

  async createDamageReport(data: InsertDamageReport): Promise<DamageReport> {
    const [report] = await db.insert(damageReports).values(data).returning();
    return report;
  }

  async getAllDamageReports(): Promise<any[]> {
    const reports = await db.query.damageReports.findMany({
      orderBy: [desc(damageReports.createdAt)],
      with: {
        reportedByUser: {
          columns: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return reports.map(r => ({
      id: r.id,
      itemId: r.itemId,
      reportedBy: r.reportedBy,
      reportType: r.reportType,
      severity: r.severity,
      description: r.description,
      status: r.status,
      resolutionNotes: r.resolutionNotes,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      reportedByName: r.reportedByUser?.name,
      reportedByRole: r.reportedByUser?.role
    }));
  }

  async getDamageReportById(id: string): Promise<DamageReport | undefined> {
    return await db.query.damageReports.findFirst({
      where: eq(damageReports.id, id)
    });
  }

  async updateDamageReport(id: string, data: Partial<InsertDamageReport>): Promise<DamageReport | undefined> {
    const [report] = await db.update(damageReports)
      .set({ ...data, resolvedAt: data.status === 'resolved' ? new Date() : undefined })
      .where(eq(damageReports.id, id))
      .returning();
    return report;
  }

  async getPermission(key: string): Promise<SystemPermission | undefined> {
    return await db.query.systemPermissions.findFirst({
      where: eq(systemPermissions.key, key)
    });
  }

  async getAllPermissions(): Promise<SystemPermission[]> {
    return await db.query.systemPermissions.findMany();
  }

  async updatePermission(key: string, enabled: boolean): Promise<SystemPermission | undefined> {
    const existing = await this.getPermission(key);
    if (existing) {
      const [updated] = await db.update(systemPermissions)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(systemPermissions.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(systemPermissions).values({ key, enabled, updatedAt: new Date() }).returning();
      return created;
    }
  }
}

export const storage = new MemStorage();
