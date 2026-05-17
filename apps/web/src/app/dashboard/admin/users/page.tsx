"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Trash2, UserPlus, Shield, User as UserIcon, Edit } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";

interface User {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "ENGINEER" | "SENIOR_ASSOCIATE" | "ASSOCIATE" | "VIEWER";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useAuthStore(state => state.user);

  // Edit User States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"MANAGER" | "ENGINEER" | "SENIOR_ASSOCIATE" | "ASSOCIATE" | "VIEWER">("ASSOCIATE");
  const [editPassword, setEditPassword] = useState("");

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role as any);
    setEditPassword("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const data: any = { name: editName, role: editRole };
      if (editPassword) data.password = editPassword;
      await api.put(`/users/${editingUser.id}`, data);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update user");
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/users", data);
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-mid">Loading users...</div>;
  if (error) return <div className="p-8 text-center text-color-error">{error}</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-display text-fir-green">User Management</h1>
          <p className="text-slate-mid mt-1">Add, remove, and manage team members.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-fir-green-light transition-colors"
        >
          <UserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-base border border-slate-border/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-b border-slate-border/50">
              <th className="p-4 text-sm font-semibold text-slate-dark uppercase tracking-wider">Name</th>
              <th className="p-4 text-sm font-semibold text-slate-dark uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="p-4 text-sm font-semibold text-slate-dark uppercase tracking-wider">Role</th>
              <th className="p-4 text-sm font-semibold text-slate-dark uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border/30">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-cream/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-fir-green">
                      {user.role === "MANAGER" ? <Shield size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-dark">{user.name}</div>
                      <div className="text-xs text-slate-mid md:hidden">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-slate-mid">{user.email}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    user.role === "MANAGER" ? "bg-amber-100 text-amber-800" :
                    user.role === "SENIOR_ASSOCIATE" ? "bg-indigo-100 text-indigo-800" :
                    user.role === "ASSOCIATE" ? "bg-teal-100 text-teal-800" :
                    user.role === "VIEWER" ? "bg-slate-100 text-slate-800 border border-slate-300" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {user.role === "VIEWER" ? "VIEWER (READ-ONLY)" : user.role.replace("_", " ")}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="p-2 rounded-lg text-slate-mid hover:text-fir-green hover:bg-emerald-50 transition-colors"
                    title="Edit user"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === currentUser?.id}
                    className={`p-2 rounded-lg transition-colors ${
                      user.id === currentUser?.id 
                        ? "text-slate-border cursor-not-allowed" 
                        : "text-slate-mid hover:text-color-error hover:bg-red-50"
                    }`}
                    title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Full Name</label>
            <input
              {...register("name", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Email Address</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="engineer@khyberresort.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Temporary Password</label>
            <input
              type="password"
              {...register("password", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="********"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Role</label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
            >
              <option value="ASSOCIATE">Associate</option>
              <option value="SENIOR_ASSOCIATE">Senior Associate</option>
              <option value="MANAGER">Manager</option>
              <option value="VIEWER">Viewer (Read-Only)</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-mid hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-medium bg-fir-green text-white hover:bg-fir-green-light rounded-lg transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User">
        <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-mid mb-1">Email Address (Read-Only)</label>
            <input
              type="email"
              value={editingUser?.email || ""}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-slate-border bg-slate-50 text-slate-mid cursor-not-allowed outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
            >
              <option value="ASSOCIATE">Associate</option>
              <option value="SENIOR_ASSOCIATE">Senior Associate</option>
              <option value="MANAGER">Manager</option>
              <option value="VIEWER">Viewer (Read-Only)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">
              New Password <span className="text-[10px] text-slate-mid italic">(Optional - leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="Enter new password to reset"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-mid hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-medium bg-fir-green text-white hover:bg-fir-green-light rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
