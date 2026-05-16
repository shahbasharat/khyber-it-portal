"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckSquare, Square, ClipboardList, Loader2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const response = await api.get("/checklist/today");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to fetch checklist", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    setToggling(itemId);
    try {
      await api.post(`/checklist/toggle/${itemId}`, { completed: !currentStatus });
      await fetchChecklist(); // Refresh to get latest state
    } catch (error) {
      console.error("Failed to toggle item", error);
    } finally {
      setToggling(null);
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Loading Daily Checklist...
    </div>;
  }

  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-base border border-slate-border/50 sticky top-20 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-dark font-display">Daily Operations Checklist</h2>
            <p className="text-sm text-slate-mid">Mandatory checks for {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-fir-green font-display">{completedCount}/{items.length}</span>
            <p className="text-xs text-slate-mid font-medium uppercase tracking-wider">Completed</p>
          </div>
        </div>
        <div className="w-full bg-cream rounded-full h-3">
          <div 
            className="bg-fir-green h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-xs font-bold text-slate-mid uppercase tracking-widest px-2">{category}</h3>
            <div className="grid grid-cols-1 gap-2">
              {items.filter(i => i.category === category).map(item => (
                <div 
                  key={item.id}
                  onClick={() => !toggling && handleToggle(item.id, item.completed)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    item.completed 
                      ? "bg-fir-green-subtle border-fir-green/20 text-fir-green" 
                      : "bg-white border-slate-border/50 text-slate-dark hover:border-fir-green/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {toggling === item.id ? (
                      <Loader2 size={24} className="animate-spin text-slate-mid" />
                    ) : item.completed ? (
                      <div className="bg-fir-green text-white rounded-md p-0.5">
                        <CheckSquare size={20} />
                      </div>
                    ) : (
                      <Square size={24} className="text-slate-mid" />
                    )}
                    <div>
                      <span className={`font-medium ${item.completed ? "line-through opacity-70" : ""}`}>
                        {item.title}
                      </span>
                      {item.completed && item.completedBy && (
                        <p className="text-[10px] opacity-70">
                          Checked by {item.completedBy} at {new Date(item.completedAt!).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {progressPercent === 100 && (
        <div className="bg-fir-green p-6 rounded-2xl text-white text-center shadow-lg animate-in fade-in zoom-in duration-500">
          <ClipboardList className="mx-auto mb-2" size={32} />
          <h3 className="text-xl font-bold">Morning Checklist Complete ✓</h3>
          <p className="text-white/80 text-sm">Excellent work! All routine checks have been recorded.</p>
        </div>
      )}
    </div>
  );
}
