import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, Users, ArrowLeft, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import InventoryHeader from "@/components/InventoryHeader";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface UserManagementProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export default function UserManagement({ userName, userRole, onLogout, onNavigateToInventory, onNavigateToReservations, onNavigateToActivityLogs, onNavigateToQRCodes, onNavigateToMaintenance, onNavigateToReports, language = 'en', onLanguageChange = () => {} }: UserManagementProps) {
  const { toast } = useToast();
  const t = useTranslation(language || 'en');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'user' as 'developer' | 'admin' | 'user',
    department: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'user' as 'developer' | 'admin' | 'user',
    department: ''
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => api.users.getAll()
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: typeof formData) => api.users.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowAddUser(false);
      setFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        role: 'user',
        department: ''
      });
      toast({ title: "User created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create user", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editFormData }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowEditUser(false);
      setEditingUserId(null);
      setEditFormData({ username: '', password: '', email: '', name: '', role: 'user', department: '' });
      toast({ title: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update user", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData({
      username: user.username,
      password: '',
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || ''
    });
    setShowEditUser(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId && editFormData.email && editFormData.name && editFormData.username) {
      updateUserMutation.mutate({
        id: editingUserId,
        data: editFormData
      });
    }
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <InventoryHeader
        userName={userName}
        userRole={userRole}
        currentView="categories"
        onViewChange={() => onNavigateToInventory?.()}
        onLogout={onLogout}
        onNavigateToReservations={onNavigateToReservations}
        onNavigateToActivityLogs={onNavigateToActivityLogs}
        onNavigateToQRCodes={onNavigateToQRCodes}
        onNavigateToMaintenance={onNavigateToMaintenance}
        onNavigateToReports={onNavigateToReports}
        hideViewToggle={true}
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <h1 className="text-4xl font-extrabold mb-4">{t('userManagement')}</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t('createManageUsers')}
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#667eea]" />
            <h2 className="text-2xl font-bold">{users.length} {t('totalUsers')}</h2>
          </div>
          {userRole === 'developer' && (
            <Button
              onClick={() => setShowAddUser(true)}
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              data-testid="button-add-user"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('addNewUser')}
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('username')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('department')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  {userRole === 'developer' && <TableHead className="text-right">{t('actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.department || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : user.role === 'developer'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? t('admin').toUpperCase() : user.role === 'developer' ? 'DEVELOPER' : t('user').toUpperCase()}
                      </span>
                    </TableCell>
                    {userRole === 'developer' && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addNewUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('username')} *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g., jsmith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')} *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('password')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., jsmith@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{t('department')}</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Production"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('role')} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'developer' | 'admin' | 'user') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('user')}</SelectItem>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? t('creating') : t('createUser')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">{t('username')} *</Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                placeholder="e.g., jsmith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">{t('password')} (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('fullName')} *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('email')} *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="e.g., jsmith@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">{t('department')}</Label>
              <Input
                id="edit-department"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                placeholder="e.g., Production"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">{t('role')} *</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: 'developer' | 'admin' | 'user') => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('user')}</SelectItem>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditUser(false)}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}