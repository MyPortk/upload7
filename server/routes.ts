import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import QRCode from "qrcode";
import { storage } from "./storage";
import { loginUser, requireAuth, requireAdmin, hashPassword } from "./auth";
import { EQUIPMENT_CATEGORIES, ASSET_CATEGORIES, CATEGORIES, insertItemSchema, insertReservationSchema, insertDamageReportSchema, users, itemEditHistory, reservationStatusHistory } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { sendReservationRequestEmail, sendReservationApprovedEmail, sendReservationRejectedEmail } from "./emailService";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default asset categories if they don't exist
  const initializeDefaultAssets = async () => {
    const existingCategories = await storage.getAllCategories();
    const assetCategoryNames = Object.values(ASSET_CATEGORIES).map(cat => cat.name);
    
    for (const assetCat of Object.values(ASSET_CATEGORIES)) {
      const exists = existingCategories.some(cat => cat.name === assetCat.name);
      if (!exists) {
        await storage.createCategory({
          name: assetCat.name,
          image: assetCat.image,
          subTypes: JSON.stringify(Array.from(assetCat.subTypes)),
          isEquipment: false,
          showQuantity: true,
          showLocation: true,
          showNotes: true
        });
        console.log(`✅ Created default asset category: ${assetCat.name}`);
      }
    }
  };
  
  // Run initialization on startup
  initializeDefaultAssets().catch(err => console.error('Failed to initialize asset categories:', err));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const result = await loginUser(username, password);

      if (!result.success) {
        return res.status(401).json({ error: result.message });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session error' });
        }

        req.session.userId = result.user!.id;
        req.session.username = result.user!.username;
        req.session.role = result.user!.role;
        req.session.name = result.user!.name;
        req.session.department = result.user!.department;

        // Save session to database
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ error: 'Failed to save session' });
          }
          res.json({
            user: result.user
          });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role,
        name: req.session.name
      }
    });
  });

  // Item routes
  app.get("/api/items", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const isEquipmentParam = req.query.isEquipment as string | undefined;
      let allItems = await storage.getAllItems();

      // Filter by equipment type if specified
      if (isEquipmentParam !== undefined) {
        const isEquipment = isEquipmentParam === 'true';
        allItems = allItems.filter(item => item.isEquipment === isEquipment);
      }

      if (category) {
        // Find the category configuration to get its subTypes
        const dbCategories = await storage.getAllCategories();

        // Check if it's a default category (Equipment or Asset)
        const defaultCategory = Object.values(EQUIPMENT_CATEGORIES).find(cat => cat.name === category) || 
                               Object.values(ASSET_CATEGORIES).find(cat => cat.name === category);

        // Check if it's a custom category
        const customCategory = dbCategories.find(cat => cat.name === category);

        let subTypes: string[] = [];

        if (defaultCategory) {
          subTypes = [...defaultCategory.subTypes];
        } else if (customCategory) {
          subTypes = JSON.parse(customCategory.subTypes);
        }

        // Log for debugging
        console.log(`Filtering category: ${category}`);
        console.log(`SubTypes for category:`, subTypes);
        console.log(`Total items:`, allItems.length);

        // Filter items whose productType matches any of the category's subTypes
        const filteredItems = allItems.filter(item => {
          const matches = subTypes.includes(item.productType);
          if (matches) {
            console.log(`✓ Item "${item.productName}" (${item.productType}) matches category`);
          } else {
            console.log(`✗ Item "${item.productName}" (${item.productType}) does NOT match subTypes: ${JSON.stringify(subTypes)}`);
          }
          return matches;
        });

        console.log(`Filtered items count: ${filteredItems.length}`);
        res.json(filteredItems);
      } else {
        res.json(allItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error('Get item error:', error);
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  });

  app.post("/api/items", requireAdmin, async (req, res) => {
    try {
      console.log('📝 Item creation request:', JSON.stringify(req.body, null, 2));
      
      // Convert empty maintenanceAvailableDate to null
      const bodyData = { ...req.body };
      if (bodyData.maintenanceAvailableDate === '' || bodyData.maintenanceAvailableDate === undefined) {
        bodyData.maintenanceAvailableDate = null;
      }
      // Convert empty notes to null
      if (bodyData.notes === '') {
        bodyData.notes = null;
      }
      
      const validatedData = insertItemSchema.parse(bodyData);
      console.log('✅ Validated data:', JSON.stringify(validatedData, null, 2));
      const item = await storage.createItem(validatedData);
      console.log('💾 Item created in DB:', JSON.stringify(item, null, 2));

      // Log item creation
      try {
        await storage.createActivityLog({
          itemId: item.id,
          userId: req.session.userId!,
          action: 'Item Created',
          oldStatus: null,
          newStatus: item.status,
          notes: `Item created: ${item.productName} - ${item.productType}. Created at ${new Date().toLocaleString()}`
        });
      } catch (logError) {
        console.error('Failed to log item creation:', logError);
      }

      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Zod validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid item data', details: error.errors });
      }
      console.error('Create item error:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  app.patch("/api/items/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertItemSchema.partial().parse(req.body);

      // Get the current item state before update
      const currentItem = await storage.getItemById(req.params.id);
      if (!currentItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const item = await storage.updateItem(req.params.id, validatedData);

      // Track all field changes
      const fieldsToTrack = ['productName', 'productType', 'status', 'location', 'notes', 'barcode'];
      for (const field of fieldsToTrack) {
        if (validatedData[field] !== undefined && validatedData[field] !== currentItem[field]) {
          try {
            await storage.createItemEditHistory({
              itemId: item.id,
              userId: req.session.userId!,
              fieldName: field,
              oldValue: String(currentItem[field] || ''),
              newValue: String(validatedData[field] || '')
            });
          } catch (historyError) {
            console.error('Failed to log field change:', historyError);
          }
        }
      }

      // Log activity if status changed
      if (validatedData.status && validatedData.status !== currentItem.status) {
        let action = 'Status Updated';

        if (validatedData.status === 'In Use' && currentItem.status === 'Available') {
          action = 'Checked Out (Manual)';
        } else if (validatedData.status === 'Available' && currentItem.status === 'In Use') {
          action = 'Checked In (Manual)';
        } else if (validatedData.status === 'Reserved') {
          action = 'Marked as Reserved';
        } else if (validatedData.status === 'Maintenance') {
          action = 'Sent to Maintenance';
        }

        try {
          await storage.createActivityLog({
            itemId: item.id,
            userId: req.session.userId!,
            action,
            oldStatus: currentItem.status,
            newStatus: validatedData.status,
            notes: `${item.productName}: ${currentItem.status} → ${validatedData.status}. Updated at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log status change:', logError);
        }
      }

      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid item data', details: error.errors });
      }
      console.error('Update item error:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  app.delete("/api/items/:id", requireAdmin, async (req, res) => {
    try {
      // Get item details before deletion
      const item = await storage.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Soft delete the item
      const deleted = await storage.softDeleteItem(req.params.id, req.session.userId!);

      // Log deletion
      try {
        await storage.createActivityLog({
          itemId: item.id,
          userId: req.session.userId!,
          action: 'Item Deleted (Soft)',
          oldStatus: item.status,
          newStatus: null,
          notes: `${item.productName} (${item.barcode}) moved to trash. Can be restored. Deleted at ${new Date().toLocaleString()}`
        });
      } catch (logError) {
        console.error('Failed to log item deletion:', logError);
      }

      res.json({ success: true, deleted });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  // QR Scan route (admin only)
  app.post("/api/scan", requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        barcode: z.string().min(1, 'Barcode is required')
      });
      const { barcode } = schema.parse(req.body);

      const item = await storage.getItemByBarcode(barcode);

      if (!item) {
        return res.json({
          success: false,
          error: `Item not found with barcode: ${barcode}`
        });
      }

      const oldStatus = item.status;
      let newStatus = oldStatus;
      let action = '';

      if (oldStatus === 'Available') {
        newStatus = 'In Use';
        action = 'Checked Out';
      } else if (oldStatus === 'In Use') {
        newStatus = 'Available';
        action = 'Checked In';
      } else if (oldStatus === 'Reserved') {
        // When admin scans a reserved item, they're confirming pickup - change to In Use
        newStatus = 'In Use';
        action = 'Checked Out';
      } else {
        return res.json({
          success: false,
          error: `Item is currently ${oldStatus} and cannot be scanned`
        });
      }

      await storage.updateItem(item.id, { status: newStatus });

      // Log the activity
      try {
        await storage.createActivityLog({
          itemId: item.id,
          userId: req.session.userId!,
          action: `${action} (QR Scan)`,
          oldStatus,
          newStatus,
          notes: `${item.productName} scanned via admin QR scanner. ${oldStatus} → ${newStatus}. Scanned at ${new Date().toLocaleString()}`
        });
      } catch (logError) {
        console.error('Failed to log QR scan:', logError);
      }

      res.json({
        success: true,
        productName: item.productName,
        barcode: item.barcode,
        oldStatus,
        newStatus,
        action
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid scan data', details: error.errors });
      }
      console.error('Scan error:', error);
      res.status(500).json({ error: 'Failed to process scan' });
    }
  });

  // Public QR Scan route (no auth required)
  app.get("/public/scan/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      const item = await storage.getItemByBarcode(barcode);

      if (!item) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Item Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .container { background: white; color: #333; padding: 40px; border-radius: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                h1 { color: #ef4444; margin-bottom: 20px; }
                p { font-size: 18px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Item Not Found</h1>
                <p>No item found with barcode: <strong>${barcode}</strong></p>
              </div>
            </body>
          </html>
        `);
      }

      const oldStatus = item.status;
      let newStatus = oldStatus;
      let action = '';
      let statusColor = '#3b82f6';

      if (oldStatus === 'Available') {
        newStatus = 'In Use';
        action = 'Checked Out';
        statusColor = '#f59e0b';
      } else if (oldStatus === 'In Use') {
        newStatus = 'Available';
        action = 'Checked In';
        statusColor = '#10b981';
      } else if (oldStatus === 'Reserved') {
        // When item is scanned while reserved, confirm pickup - change to In Use
        newStatus = 'In Use';
        action = 'Checked Out';
        statusColor = '#f59e0b';
      } else {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cannot Process</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .container { background: white; color: #333; padding: 40px; border-radius: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                h1 { color: #f59e0b; margin-bottom: 20px; }
                .status { background: #fef3c7; padding: 10px 20px; border-radius: 10px; display: inline-block; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>⚠️ Cannot Process</h1>
                <p><strong>${item.productName}</strong></p>
                <div class="status">Current Status: ${oldStatus}</div>
                <p>This item cannot be checked out/in at this time.</p>
              </div>
            </body>
          </html>
        `);
      }

      await storage.updateItem(item.id, { status: newStatus });

      // Get a system user for logging (first admin user)
      const systemUser = await db.query.users.findFirst({
        where: eq(users.role, 'admin')
      });

      if (systemUser) {
        try {
          await storage.createActivityLog({
            itemId: item.id,
            userId: systemUser.id,
            action: `${action} (Public QR)`,
            oldStatus,
            newStatus,
            notes: `${item.productName} scanned via public QR code. ${oldStatus} → ${newStatus}. Scanned at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log public QR scan:', logError);
        }
      }

      const timestamp = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${action === 'Checked Out' ? 'Item Checked Out' : 'Item Returned'} Successfully</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
              }
              .container { 
                background: white;
                padding: 40px;
                border-radius: 24px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.4s ease-out;
              }
              @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              .icon-container {
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
                background: ${action === 'Checked Out' ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
              }
              @keyframes bounceIn {
                0% { transform: scale(0); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
              h1 { 
                color: #111827;
                font-size: 28px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 8px;
              }
              .subtitle {
                text-align: center;
                color: #6b7280;
                font-size: 16px;
                margin-bottom: 32px;
              }
              .info-card {
                background: #f9fafb;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child { border-bottom: none; }
              .label {
                font-weight: 600;
                color: #6b7280;
                font-size: 14px;
              }
              .value {
                font-weight: 700;
                color: #111827;
                font-size: 14px;
                text-align: right;
                max-width: 60%;
                word-break: break-word;
              }
              .status-badge {
                background: ${statusColor};
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
              }
              .action-badge {
                background: ${action === 'Checked Out' ? '#f59e0b' : '#10b981'};
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
              }
              .success-message {
                background: ${action === 'Checked Out' ? '#fef3c7' : '#d1fae5'};
                color: ${action === 'Checked Out' ? '#92400e' : '#065f46'};
                padding: 16px;
                border-radius: 12px;
                text-align: center;
                font-weight: 600;
                font-size: 15px;
                border: 2px solid ${action === 'Checked Out' ? '#fbbf24' : '#34d399'};
              }
              .timestamp {
                text-align: center;
                color: #9ca3af;
                font-size: 13px;
                margin-top: 16px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon-container">
                ${action === 'Checked Out' ? '📦' : '✅'}
              </div>
              <h1>${action === 'Checked Out' ? 'Item Checked Out' : 'Item Returned'} Successfully!</h1>
              <p class="subtitle">${item.productName}</p>

              <div class="info-card">
                <div class="info-row">
                  <span class="label">Barcode</span>
                  <span class="value">${item.barcode}</span>
                </div>
                <div class="info-row">
                  <span class="label">Product Type</span>
                  <span class="value">${item.productType}</span>
                </div>
                <div class="info-row">
                  <span class="label">Action</span>
                  <span class="action-badge">${action}</span>
                </div>
                <div class="info-row">
                  <span class="label">New Status</span>
                  <span class="status-badge">${newStatus}</span>
                </div>
              </div>

              <div class="success-message">
                ${action === 'Checked Out' ? '📦 This item is now marked as "In Use" in the system' : '✨ This item is now marked as "Available" and ready for use'}
              </div>

              <div class="timestamp">
                ${timestamp}
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Public scan error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
              .container { background: white; color: #333; padding: 40px; border-radius: 20px; max-width: 500px; margin: 0 auto; }
              h1 { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Error</h1>
              <p>Failed to process scan. Please try again.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Categories route
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const isEquipmentParam = req.query.isEquipment as string | undefined;
      const allItems = await storage.getAllItems();
      const dbCategories = await storage.getAllCategories();

      // Determine which categories to show based on filter
      let shouldShowEquipment = true;
      if (isEquipmentParam !== undefined) {
        shouldShowEquipment = isEquipmentParam === 'true';
      }

      // Only show database categories - avoid duplication
      const allCategories = dbCategories
        .filter(cat => {
          // Filter categories by isEquipment flag
          return shouldShowEquipment === cat.isEquipment;
        })
        .map(cat => {
          const subTypes = JSON.parse(cat.subTypes);
          const categoryItems = allItems.filter(item => 
            subTypes.includes(item.productType)
          );

          return {
            id: cat.id,
            name: cat.name,
            image: cat.image,
            subTypes,
            totalCount: categoryItems.length,
            availableCount: categoryItems.filter(item => item.status === 'Available').length,
            isCustom: true,
            isEquipment: cat.isEquipment
          };
        });

      res.json(allCategories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Category management routes (admin only)
  app.post("/api/custom-categories", requireAdmin, async (req, res) => {
    try {
      console.log('📝 POST body:', JSON.stringify(req.body, null, 2));
      const validatedData = z.object({
        name: z.string().min(1, "Category name is required"),
        image: z.string().url("Valid image URL is required"),
        subTypes: z.array(z.string()).min(1, "At least one product type is required"),
        isEquipment: z.boolean().default(true)
      }).parse(req.body);

      // Check if category name already exists
      const existingCategories = await storage.getAllCategories();
      const nameExists = existingCategories.some(
        cat => cat.name.toLowerCase() === validatedData.name.toLowerCase()
      );

      if (nameExists) {
        return res.status(400).json({ error: 'A category with this name already exists' });
      }

      console.log('📁 Creating custom category with isEquipment:', validatedData.isEquipment);
      const category = await storage.createCategory({
        name: validatedData.name,
        image: validatedData.image,
        subTypes: JSON.stringify(validatedData.subTypes),
        isEquipment: validatedData.isEquipment,
        showQuantity: true,
        showLocation: true,
        showNotes: true
      });
      console.log('✅ Category created:', { name: category.name, isEquipment: category.isEquipment });

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid category data', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.patch("/api/custom-categories/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
        subTypes: z.array(z.string()).optional(),
        isEquipment: z.boolean().optional(),
        showQuantity: z.boolean().optional(),
        showLocation: z.boolean().optional(),
        showNotes: z.boolean().optional()
      }).parse(req.body);

      const updateData: any = { ...validatedData };
      if (validatedData.subTypes) {
        updateData.subTypes = JSON.stringify(validatedData.subTypes);
      }

      const category = await storage.updateCategory(req.params.id, updateData);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid category data', details: error.errors });
      }
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete("/api/custom-categories/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Reservation routes
  app.get("/api/reservations", requireAuth, async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      console.error('Get reservations error:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  });

  app.get("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const reservation = await storage.getReservationById(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      res.json(reservation);
    } catch (error) {
      console.error('Get reservation error:', error);
      res.status(500).json({ error: 'Failed to fetch reservation' });
    }
  });

  app.get("/api/reservations/item/:itemId", requireAuth, async (req, res) => {
    try {
      const reservations = await storage.getReservationsByItem(req.params.itemId);
      // Only return active reservations (pending, approved)
      const activeReservations = reservations.filter(
        r => r.status === 'pending' || r.status === 'approved'
      );
      res.json(activeReservations);
    } catch (error) {
      console.error('Get item reservations error:', error);
      res.status(500).json({ error: 'Failed to fetch item reservations' });
    }
  });

  app.post("/api/reservations", requireAuth, async (req, res) => {
    try {
      console.log('📝 POST /api/reservations body:', req.body);
      console.log('📝 Session userId:', req.session.userId);
      
      // Use session userId instead of body userId
      const bodyData = req.body;
      const validatedData = insertReservationSchema.parse({
        ...bodyData,
        userId: req.session.userId // Override with session userId
      });

      // Check for date conflicts
      const hasConflict = await storage.checkReservationConflict(
        validatedData.itemId,
        validatedData.startDate,
        validatedData.returnDate
      );

      if (hasConflict) {
        return res.status(409).json({ 
          error: 'This item is already reserved for the selected dates. Please choose different dates.' 
        });
      }

      const reservation = await storage.createReservation(validatedData);

      // Get item details
      const item = await storage.getItemById(validatedData.itemId);
      const oldStatus = item?.status || 'Available';

      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, validatedData.userId)
      });

      // Notify all admins about new reservation request
      try {
        const admins = await db.query.users.findMany({
          where: eq(users.role, 'admin')
        });

        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: 'reservation_request',
            title: 'New Reservation Request',
            message: `${user?.name || 'A user'} has requested ${item?.productName || 'an item'} from ${new Date(validatedData.startDate).toLocaleDateString()} to ${new Date(validatedData.returnDate).toLocaleDateString()}`,
            relatedId: reservation.id,
            isRead: 'false',
            notificationFor: 'admin'
          });

          // Send email notification to admin
          if (admin.email) {
            await sendReservationRequestEmail(admin.email, {
              itemName: item?.productName || 'Item',
              userName: user?.name || 'User',
              userEmail: user?.email || '',
              startDate: format(new Date(validatedData.startDate), 'MMM dd, yyyy'),
              returnDate: format(new Date(validatedData.returnDate), 'MMM dd, yyyy'),
              notes: validatedData.notes,
              deliveryRequired: validatedData.deliveryRequired,
              deliveryLocation: validatedData.deliveryLocation,
              deliveryStreet: validatedData.deliveryStreet,
              deliveryArea: validatedData.deliveryArea,
              googleMapLink: validatedData.googleMapLink
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create admin notifications:', notifError);
      }

      // Log activity
      try {
        await storage.createActivityLog({
          itemId: validatedData.itemId,
          userId: validatedData.userId,
          action: 'Reservation Created',
          oldStatus,
          newStatus: oldStatus,
          notes: `${item?.productName || 'Item'} reservation requested by ${user?.name || 'User'} from ${new Date(validatedData.startDate).toLocaleDateString()} to ${new Date(validatedData.returnDate).toLocaleDateString()}. Reservation Status: Pending (awaiting admin approval). Created at ${new Date().toLocaleString()}`
        });
      } catch (logError) {
        console.error('Failed to log reservation creation:', logError);
      }

      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid reservation data', details: error.errors });
      }
      console.error('Create reservation error:', error);
      res.status(500).json({ error: 'Failed to create reservation' });
    }
  });

  app.patch("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReservationSchema.partial().extend({
        rejectionReason: z.string().optional(),
        itemConditionOnReceive: z.string().optional(),
        itemConditionOnReturn: z.string().optional(),
        checkoutDate: z.date().optional().or(z.string().datetime().transform(str => new Date(str))),
        returnedDate: z.date().optional().or(z.string().datetime().transform(str => new Date(str))),
        returnNotes: z.string().optional()
      }).parse(req.body);

      // Get current reservation state
      const currentReservation = await storage.getReservationById(req.params.id);
      if (!currentReservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const reservation = await storage.updateReservation(req.params.id, validatedData);

      // Track status changes
      if (validatedData.status && validatedData.status !== currentReservation.status) {
        try {
          await storage.createReservationStatusHistory({
            reservationId: reservation.id,
            userId: req.session.userId!,
            oldStatus: currentReservation.status,
            newStatus: validatedData.status,
            notes: validatedData.rejectionReason || `Status changed from ${currentReservation.status} to ${validatedData.status}`
          });
        } catch (historyError) {
          console.error('Failed to log reservation status change:', historyError);
        }
      }

      const item = await storage.getItemById(reservation.itemId);

      // Update item status based on reservation status
      if (validatedData.status === 'rejected') {
        await storage.updateItem(reservation.itemId, { status: 'Available' });

        // Create notification for user about rejection
        try {
          await storage.createNotification({
            userId: reservation.userId,
            type: 'reservation_rejected',
            title: 'Reservation Rejected',
            message: `Your reservation for ${item?.productName || 'item'} has been rejected${validatedData.rejectionReason ? `: ${validatedData.rejectionReason}` : '.'}`,
            relatedId: reservation.id,
            isRead: 'false',
            notificationFor: 'user'
          });

          // Send rejection email
          const user = await db.query.users.findFirst({
            where: eq(users.id, reservation.userId)
          });
          if (user?.email) {
            await sendReservationRejectedEmail(user.email, {
              itemName: item?.productName || 'Item',
              userName: user.name,
              userEmail: user.email,
              startDate: format(new Date(reservation.startDate), 'MMM dd, yyyy'),
              returnDate: format(new Date(reservation.returnDate), 'MMM dd, yyyy'),
              rejectionReason: validatedData.rejectionReason
            });
          }
        } catch (notifError) {
          console.error('Failed to create rejection notification:', notifError);
        }

        // Log activity
        try {
          await storage.createActivityLog({
            itemId: reservation.itemId,
            userId: req.session.userId!,
            action: 'Reservation Rejected',
            oldStatus: item?.status || 'Reserved',
            newStatus: 'Available',
            notes: `${item?.productName || 'Item'} reservation rejected by ${req.session.name}${validatedData.rejectionReason ? `. Reason: ${validatedData.rejectionReason}` : ''}. Status: Reserved → Available. Updated at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log reservation status change:', logError);
        }
      } else if (validatedData.status === 'completed') {
        // Update item status back to Available when reservation is completed
        await storage.updateItem(reservation.itemId, { status: 'Available' });

        // Log activity for return confirmation
        try {
          await storage.createActivityLog({
            itemId: reservation.itemId,
            userId: req.session.userId!,
            action: 'Equipment Return Confirmed',
            oldStatus: item?.status || 'Reserved',
            newStatus: 'Available',
            notes: `${item?.productName || 'Item'} return confirmed by ${req.session.name}. Condition: ${validatedData.itemConditionOnReturn || 'No notes provided'}. Status: Reserved → Available. Returned at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log return confirmation:', logError);
        }
      } else if (validatedData.checkoutDate && !currentReservation.checkoutDate) {
        // Increment checkout count when item is FIRST checked out (checkoutDate wasn't set before)
        const currentCheckoutCount = parseInt(item?.checkoutCount || '0');
        const newCount = currentCheckoutCount + 1;
        console.log(`📦 Incrementing checkout count for item ${reservation.itemId}: ${currentCheckoutCount} → ${newCount}`);
        await storage.updateItem(reservation.itemId, { checkoutCount: String(newCount) });

        // Only record the receipt condition - do NOT change item status
        // Log activity for receipt confirmation (condition only, no status change)
        try {
          await storage.createActivityLog({
            itemId: reservation.itemId,
            userId: req.session.userId!,
            action: 'Equipment Receipt Confirmed',
            oldStatus: item?.status || 'Reserved',
            newStatus: item?.status || 'Reserved',
            notes: `${item?.productName || 'Item'} received by ${req.session.name}. Condition: ${validatedData.itemConditionOnReceive || 'No notes provided'}. Status remains: ${item?.status || 'Reserved'}. Received at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log receipt confirmation:', logError);
        }

        // Create notification for user
        try {
          await storage.createNotification({
            userId: reservation.userId,
            type: 'equipment_received',
            title: 'Equipment Received',
            message: `You have successfully received ${item?.productName || 'equipment'}. Return by ${format(new Date(reservation.returnDate), 'MMM dd, yyyy')} at ${reservation.returnTime || '17:00'}`,
            relatedId: reservation.id,
            isRead: 'false',
            notificationFor: 'user'
          });
        } catch (notifError) {
          console.error('Failed to create checkout notification:', notifError);
        }
      } else if (validatedData.status === 'approved') {
        await storage.updateItem(reservation.itemId, { status: 'Reserved' });

        // Create notification for user about approval
        try {
          await storage.createNotification({
            userId: reservation.userId,
            type: 'reservation_approved',
            title: 'Reservation Approved',
            message: `Your reservation for ${item?.productName || 'item'} has been approved!`,
            relatedId: reservation.id,
            isRead: 'false',
            notificationFor: 'user'
          });

          // Send approval email
          const user = await db.query.users.findFirst({
            where: eq(users.id, reservation.userId)
          });
          if (user?.email) {
            await sendReservationApprovedEmail(user.email, {
              itemName: item?.productName || 'Item',
              userName: user.name,
              userEmail: user.email,
              startDate: format(new Date(reservation.startDate), 'MMM dd, yyyy'),
              returnDate: format(new Date(reservation.returnDate), 'MMM dd, yyyy')
            });
          }
        } catch (notifError) {
          console.error('Failed to create approval notification:', notifError);
        }

        // Log activity
        try {
          await storage.createActivityLog({
            itemId: reservation.itemId,
            userId: req.session.userId!,
            action: 'Reservation Approved',
            oldStatus: item?.status || 'Available',
            newStatus: 'Reserved',
            notes: `${item?.productName || 'Item'} reservation approved by ${req.session.name}. Status: ${item?.status} → Reserved. Approved at ${new Date().toLocaleString()}`
          });
        } catch (logError) {
          console.error('Failed to log reservation approval:', logError);
        }
      }

      res.json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid reservation data', details: error.errors });
      }
      console.error('Update reservation error:', error);
      res.status(500).json({ error: 'Failed to update reservation' });
    }
  });

  // QR Code generation route
  app.get("/api/items/:id/qrcode", requireAuth, async (req, res) => {
    try {
      const item = await storage.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Generate public scan URL
      const publicUrl = `${req.protocol}://${req.get('host')}/public/scan/${item.barcode}`;

      // Generate QR code as data URL with public link
      const qrCodeUrl = await QRCode.toDataURL(publicUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({ qrCode: qrCodeUrl, barcode: item.barcode, publicUrl });
    } catch (error) {
      console.error('QR code generation error:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // Generate all QR codes
  app.get("/api/qrcodes/all", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllItems();
      const qrCodes = await Promise.all(
        items.map(async (item) => {
          const publicUrl = `${req.protocol}://${req.get('host')}/public/scan/${item.barcode}`;
          const qrCode = await QRCode.toDataURL(publicUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          return {
            id: item.id,
            barcode: item.barcode,
            productName: item.productName,
            qrCode,
            publicUrl
          };
        })
      );
      res.json(qrCodes);
    } catch (error) {
      console.error('QR codes generation error:', error);
      res.status(500).json({ error: 'Failed to generate QR codes' });
    }
  });

  // User management routes (admin or developer)
  const requireAdminOrDeveloper = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.session.role !== 'developer' && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  app.get("/api/users", requireAdminOrDeveloper, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          department: true
        }
      });
      res.json(allUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post("/api/users", requireAdminOrDeveloper, async (req, res) => {
    try {
      const validatedData = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(3, "Password must be at least 3 characters"),
        email: z.string().email("Valid email is required"),
        name: z.string().min(1, "Name is required"),
        role: z.enum(['developer', 'admin', 'user']).default('user'),
        department: z.string().optional()
      }).parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const [newUser] = await db.insert(users).values({
        username: validatedData.username,
        password: hashedPassword,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        department: validatedData.department || null
      }).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        department: users.department
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid user data', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.patch("/api/users/:id", requireAdminOrDeveloper, async (req, res) => {
    try {
      const validatedData = z.object({
        email: z.string().email("Valid email is required").optional(),
        name: z.string().min(1, "Name is required").optional(),
        role: z.enum(['developer', 'admin', 'user']).optional(),
        department: z.string().optional()
      }).parse(req.body);

      const updateData: any = {};
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.role) updateData.role = validatedData.role;
      if (validatedData.department !== undefined) updateData.department = validatedData.department || null;

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.params.id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          department: users.department
        });

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid user data', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete("/api/users/:id", requireAdminOrDeveloper, async (req, res) => {
    try {
      // Prevent deleting self
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await db.delete(users).where(eq(users.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Activity log routes
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let logs = await storage.getAllActivityLogs();
      
      // Filter by date range if provided
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 86400000);
        
        logs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= start && logDate <= end;
        });
      }
      
      res.json(logs);
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });

  app.get("/api/activity-logs/item/:itemId", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getActivityLogsByItem(req.params.itemId);
      res.json(logs);
    } catch (error) {
      console.error('Get item activity logs error:', error);
      res.status(500).json({ error: 'Failed to fetch item activity logs' });
    }
  });

  // Item Edit History routes
  app.get('/api/item-edit-history/:itemId', requireAuth, async (req, res) => {
    try {
      const { itemId } = req.params;
      const history = await db
        .select({
          id: itemEditHistory.id,
          fieldName: itemEditHistory.fieldName,
          oldValue: itemEditHistory.oldValue,
          newValue: itemEditHistory.newValue,
          timestamp: itemEditHistory.timestamp,
          userName: users.name,
        })
        .from(itemEditHistory)
        .innerJoin(users, eq(itemEditHistory.userId, users.id))
        .where(eq(itemEditHistory.itemId, itemId))
        .orderBy(desc(itemEditHistory.timestamp));

      res.json(history);
    } catch (error: any) {
      console.error('Get item edit history error:', error);
      res.status(500).json({ error: 'Failed to get item edit history' });
    }
  });

  // Reservation Status History routes
  app.get('/api/reservation-status-history/:reservationId', requireAuth, async (req, res) => {
    try {
      const { reservationId } = req.params;
      const history = await db
        .select({
          id: reservationStatusHistory.id,
          oldStatus: reservationStatusHistory.oldStatus,
          newStatus: reservationStatusHistory.newStatus,
          notes: reservationStatusHistory.notes,
          timestamp: reservationStatusHistory.timestamp,
          userName: users.name,
        })
        .from(reservationStatusHistory)
        .innerJoin(users, eq(reservationStatusHistory.userId, users.id))
        .where(eq(reservationStatusHistory.reservationId, reservationId))
        .orderBy(desc(reservationStatusHistory.timestamp));

      res.json(history);
    } catch (error: any) {
      console.error('Get reservation status history error:', error);
      res.status(500).json({ error: 'Failed to get reservation status history' });
    }
  });

  // Damage Reports routes
  app.get('/api/damage-reports', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let reports = await storage.getAllDamageReports();
      
      // Filter by date range if provided
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 86400000);
        
        reports = reports.filter(report => {
          const reportDate = new Date(report.createdAt);
          return reportDate >= start && reportDate <= end;
        });
      }
      
      res.json(reports);
    } catch (error) {
      console.error('Get damage reports error:', error);
      res.status(500).json({ error: 'Failed to fetch damage reports' });
    }
  });

  app.post('/api/damage-reports', requireAuth, async (req, res) => {
    try {
      const validatedData = insertDamageReportSchema.parse(req.body);
      const report = await storage.createDamageReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid damage report data', details: error.errors });
      }
      console.error('Create damage report error:', error);
      res.status(500).json({ error: 'Failed to create damage report' });
    }
  });

  app.patch('/api/damage-reports/:id', requireAuth, async (req, res) => {
    try {
      const { status, resolutionNotes } = req.body;
      const report = await storage.updateDamageReport(req.params.id, { status, resolutionNotes });
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Update damage report error:', error);
      res.status(500).json({ error: 'Failed to update damage report' });
    }
  });

  // Permissions routes
  app.get('/api/permissions', requireAuth, async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      const permissionsObj: { [key: string]: boolean } = {};
      permissions.forEach(p => {
        permissionsObj[p.key] = p.enabled;
      });
      res.json(permissionsObj);
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({ error: 'Failed to get permissions' });
    }
  });

  app.patch('/api/permissions/:key', requireAuth, async (req, res) => {
    try {
      // Only admins and developers can update permissions
      if (req.session?.role !== 'admin' && req.session?.role !== 'developer') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { key } = req.params;
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }

      const permission = await storage.updatePermission(key, enabled);
      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }
      res.json(permission);
    } catch (error) {
      console.error('Update permission error:', error);
      res.status(500).json({ error: 'Failed to update permission' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}