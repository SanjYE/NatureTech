import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Plus, User, Calendar, AlertCircle, Check } from 'lucide-react';

interface FarmActionLogProps {
  onBack: () => void;
  user: any;
}

export function FarmActionLog({ onBack, user }: FarmActionLogProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Task Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: ''
  });

  const isManager = ['manager', 'admin', 'owner'].includes(user.role?.toLowerCase());

  useEffect(() => {
    fetchTasks();
    if (isManager) {
        fetchMembers();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
        const res = await fetch(`http://localhost:5000/tasks?userId=${user.user_id}&role=${user.role}&organisationId=${user.organisationId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            setTasks(data);
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
    } finally {
        setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!user.organisationId) {
        console.warn("Cannot fetch members: User has no Organisation ID", user);
        return;
    }
    try {
        console.log(`Fetching members for Org ID: ${user.organisationId}`);
        const res = await fetch(`http://localhost:5000/organisation/${user.organisationId}/members`);
        const data = await res.json();
        console.log("Members fetched:", data);
        setMembers(data);
    } catch (error) {
        console.error("Error fetching members:", error);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));

    try {
        await fetch(`http://localhost:5000/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        // Refetch to confirm
        fetchTasks();
    } catch (error) {
         console.error("Error updating task:", error);
         fetchTasks(); // Revert on error
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const payload = {
            organisationId: user.organisationId,
            createdBy: user.user_id,
            assignedTo: newTask.assignedTo,
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            dueDate: newTask.dueDate
        };

        const res = await fetch('http://localhost:5000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Task assigned successfully!');
            setShowTaskForm(false);
            setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
            fetchTasks();
        }
    } catch (error) {
        console.error("Error creating task:", error);
    }
  };

  // Derived Lists
  // Robust String comparison to avoid type mismatches. Showing all tasks so farmers can check/uncheck them.
  const myToDoList = tasks.filter(t => String(t.assigned_to) === String(user.user_id));
  
  // For managers: tasks they created
  const assignedByMeList = tasks.filter(t => String(t.created_by) === String(user.user_id));

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-[#1b6b3a]">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-[#1b6b3a]">Farm Action Log</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
        
        {/* Section A: My To-Do List */}
        <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-red-500" size={20} />
                My To-Do List
            </h2>
            
            {myToDoList.length === 0 ? (
                <div className="bg-white p-6 rounded-xl text-center text-gray-500 shadow-sm">
                    No pending tasks!
                </div>
            ) : (
                <div className="space-y-3">
                    {myToDoList.map(task => (
                        <div key={task.task_id} className={`p-4 rounded-xl shadow-sm border flex items-start gap-4 transition-colors ${
                            task.status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-100'
                        }`}>
                            <button 
                                onClick={() => handleToggleStatus(task.task_id, task.status)}
                                className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                    task.status === 'completed' 
                                        ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                                        : 'bg-white border-gray-300 hover:border-[#1b6b3a]'
                                }`}
                            >
                                {task.status === 'completed' && <Check size={14} strokeWidth={3} />}
                            </button>
                            <div className="flex-1">
                                <h3 className={`font-semibold transition-colors ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                    {task.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                    <span className={`px-2 py-0.5 rounded-full ${
                                        task.priority === 'High' ? 'bg-red-100 text-red-600' :
                                        task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {task.priority}
                                    </span>
                                    {task.due_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <User size={12} />
                                        By: {task.created_by_name || 'Admin'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* Manager Sections */}
        {isManager && (
            <>
                <hr className="border-gray-200" />
                
                {/* Section B: Assign New Task */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Plus className="text-[#1b6b3a]" size={20} />
                            Assign New Task
                        </h2>
                        {!showTaskForm && (
                           <button 
                                onClick={() => setShowTaskForm(true)}
                                className="text-sm text-white px-4 py-2 rounded-lg font-bold shadow-md border-2 border-transparent active:scale-95 transition-all flex items-center gap-2"
                                style={{ backgroundColor: '#22c55e', color: 'black' }}
                           >
                                <Plus size={18} />
                                Assign New Task
                           </button>
                        )}
                    </div>

                    {showTaskForm && (
                        <div className="bg-white p-5 rounded-xl shadow-md border border-[#1b6b3a]/20 mb-6 animate-in fade-in slide-in-from-top-4">
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Task Title</label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="e.g. Inspect Block A irrigation"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={newTask.title}
                                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                                    <textarea 
                                        rows={2}
                                        placeholder="More details..."
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={newTask.description}
                                        onChange={e => setNewTask({...newTask, description: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Assign To</label>
                                        <select 
                                            required
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={newTask.assignedTo}
                                            onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                                        >
                                            <option value="">-- Select Farmer --</option>
                                            {members.map(m => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    {m.full_name} ({m.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                                        <select 
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({...newTask, priority: e.target.value})}
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowTaskForm(false)}
                                        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-2 text-sm rounded-lg"
                                        style={{ backgroundColor: '#1b6b3a', color: 'white' }}
                                    >
                                        Assign Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </section>

                {/* Section C: Tasks Assigned By Me */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-500" size={20} />
                        Tasks Assigned By Me
                    </h2>
                     {assignedByMeList.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl text-center text-gray-500 shadow-sm">
                            You haven't assigned any tasks yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignedByMeList.map(task => (
                                <div key={task.task_id} className={`bg-white p-4 rounded-xl shadow-sm border ${task.status === 'completed' ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`font-semibold ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>To: <span className="font-medium text-gray-700">{task.assigned_to_name}</span></span>
                                                <span>•</span>
                                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            task.status === 'completed' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>
                                    {task.status === 'completed' && task.completed_at && (
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            Done on {new Date(task.completed_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}

      </div>
    </div>
  );
}
