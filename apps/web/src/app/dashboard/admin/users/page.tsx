"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Trash2, UserPlus, Shield, User as UserIcon } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";

interface User {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "ENGINEER";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useAuthStore(state => state.user);

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
                    user.role === "MANAGER" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-right">
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
              <option value="ENGINEER">Engineer</option>
              <option value="MANAGER">Manager</option>
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
    </div>
  );
}
