import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Shield, 
  MapPin, 
  Clock,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Mail,
  MoreVertical
} from 'lucide-react';
import { MOCK_USERS, MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { formatDate, cn } from '../../../shared/utils/cn';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { User, UserRole } from '../../../shared/types/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { logAudit, AuditAction } from '../../monitoring/api/auditService';

const UserStatusBadge = ({ isActive }: { isActive: boolean }) => {
  const styles = {
    true: "bg-green-500/10 text-green-500 border-green-500/20",
    false: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const icons = {
    true: <CheckCircle2 className="w-3 h-3" />,
    false: <XCircle className="w-3 h-3" />
  };

  const label = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <span className={cn(
      "px-2 py-1 text-[8px] font-bold uppercase tracking-widest border flex items-center gap-1.5 w-fit",
      isActive ? styles.true : styles.false
    )}>
      {isActive ? icons.true : icons.false}
      {label}
    </span>
  );
};

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  // Use local state initialized with mock data + local storage
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Load users from mock + local storage
    const createdUsers = JSON.parse(localStorage.getItem('cdf_created_users') || '[]');
    setUsers([...MOCK_USERS, ...createdUsers]);
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const saveToLocalStorage = (updatedUsers: User[]) => {
    const createdUsers = updatedUsers.filter(u => u.id.startsWith('user-'));
    localStorage.setItem('cdf_created_users', JSON.stringify(createdUsers));
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const userToDelete = users.find(u => u.id === userId);
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      saveToLocalStorage(updatedUsers);

      if (userToDelete) {
        logAudit(AuditAction.USER_DELETE, 'USER', userId, {
          userId: currentUser?.id,
          userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
          description: `Deleted user: ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`
        });
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);
    saveToLocalStorage(updatedUsers);

    const affectedUser = updatedUsers.find(u => u.id === userId);
    if (affectedUser) {
      logAudit(AuditAction.USER_UPDATE, 'USER', userId, {
        userId: currentUser?.id,
        userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        description: `Toggled status to ${affectedUser.isActive ? 'ACTIVE' : 'INACTIVE'} for ${affectedUser.firstName} ${affectedUser.lastName}`
      });
    }
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (selectedUser) {
      // Update
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, ...userData, updatedAt: new Date().toISOString() } as User : u
      );
      setUsers(updatedUsers);
      saveToLocalStorage(updatedUsers);

      logAudit(AuditAction.USER_UPDATE, 'USER', selectedUser.id, {
        userId: currentUser?.id,
        userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        description: `Updated profile for ${userData.firstName} ${userData.lastName}`,
        newValue: JSON.stringify(userData)
      });
    } else {
      // Create
      const newUser: User = {
        ...userData as User,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);
      saveToLocalStorage(updatedUsers);

      logAudit(AuditAction.USER_CREATE, 'USER', newUser.id, {
        userId: currentUser?.id,
        userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        description: `Provisioned new user: ${newUser.firstName} ${newUser.lastName} as ${newUser.role}`,
        newValue: JSON.stringify(newUser)
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">Access Control</h1>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold">Managing {users.length} Registered System Officers</p>
        </div>
        <button 
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      <div className="dashboard-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center gap-4 bg-muted/20">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, EMAIL OR ROLE..." 
              className="w-full pl-12 pr-4 py-3 bg-muted border border-border text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-8 gap-8">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="dashboard-card p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : (
            filteredUsers.map((user) => {
              const fullName = `${user.firstName} ${user.lastName}`;
              const constituency = MOCK_CONSTITUENCIES.find(c => c.id === user.constituencyId);
              return (
              <motion.div 
                key={user.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group border border-border bg-card hover:border-primary transition-all p-6 relative flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`} 
                      alt={fullName}
                      className="w-14 h-14 bg-muted border border-border group-hover:border-primary transition-colors"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${fullName}&background=random`; }}
                    />
                    {user.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
                    )}
                  </div>
                  <button onClick={() => toggleUserStatus(user.id)}>
                    <UserStatusBadge isActive={user.isActive} />
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">{fullName}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-tight mb-4">
                    <Shield className="w-3 h-3" />
                    {user.role.replace('_', ' ')}
                    {user.department && (
                      <span className="opacity-40"> • {user.department}</span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {constituency && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span>{constituency.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                      <Clock className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      <span>Last Activity: {formatDate(user.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    Manage Access
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )})
          )}

          {filteredUsers.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
              <UsersIcon className="w-12 h-12 mx-auto mb-4" />
              <p className="label-caps">No personnel found matching criteria</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <UserManagementModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            user={selectedUser}
            onSave={handleSaveUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: Partial<User>) => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const isEditing = !!user?.id;
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || UserRole.COUNCIL_OFFICER,
    constituencyId: user?.constituencyId || '',
    department: user?.department || '',
    isActive: user?.isActive ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Add artificial delay
    setTimeout(() => {
      onSave(formData);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border w-full max-w-xl shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-widest leading-none">
                {isEditing ? 'Access Management' : 'Provisioning Protocol'}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1 italic">Identity & Permission Matrix Authorization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="label-caps">First Name</label>
                <input 
                  type="text" 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps">Last Name</label>
                <input 
                  type="text" 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps">Government Email</label>
                <input 
                  type="email" 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps">Department / Unit</label>
                <input 
                  type="text" 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="E.G. PROCUREMENT, PLANNING..."
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="label-caps">System Role</label>
                <select 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  required
                >
                  <option value={UserRole.ADMIN}>System Administrator</option>
                  <option value={UserRole.ME_OFFICER}>National M&amp;E Officer</option>
                  <option value={UserRole.COUNCIL_OFFICER}>Constituency Officer</option>
                  <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={UserRole.FIELD_OFFICER}>Monitoring Officer</option>
                  <option value={UserRole.AUDITOR}>Auditor / Compliance Officer</option>
                  <option value={UserRole.PUBLIC_USER}>Public Viewer</option>
                  <option value={UserRole.BENEFICIARY}>Beneficiary</option>
                </select>
              </div>

              {(formData.role === UserRole.COUNCIL_OFFICER ||
                formData.role === UserRole.FINANCE_OFFICER ||
                formData.role === UserRole.FIELD_OFFICER ||
                formData.role === UserRole.BENEFICIARY) && (
                <div className="space-y-2">
                  <label className="label-caps">Jurisdiction / Constituency</label>
                  <select 
                    className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                    value={formData.constituencyId}
                    onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                    required
                  >
                    <option value="">Select Constituency...</option>
                    {MOCK_CONSTITUENCIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="label-caps">Account Status</label>
                <select 
                  className="w-full bg-muted border border-border p-3 text-[11px] font-bold uppercase tracking-widest focus:border-primary outline-none"
                  value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                  required
                >
                  <option value="ACTIVE">Authorized / Active</option>
                  <option value="INACTIVE">Deauthorized / Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-4">Cancel</button>
            <button 
              type="submit" 
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isEditing ? 'Commit Changes' : 'Authorize Provisioning'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
