import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    penalty: '',
    assignTo: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.assignTo) {
      setError('Please select a user to assign the task');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tasks/create', newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewTask({
        title: '',
        description: '',
        difficulty: 'medium',
        penalty: '',
        assignTo: ''
      });
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tasks.map(task => ({
      Title: task.title,
      Description: task.description,
      Difficulty: task.difficulty,
      Status: task.status,
      Penalty: task.penalty,
      'Assigned To': task.assigned_to_name || 'Unassigned'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    XLSX.writeFile(workbook, 'tasks_list.xlsx');
  };

  const christmasActivities = [
    "Sing a Christmas carol",
    "Do a Christmas dance",
    "Tell a Christmas joke",
    "Make a paper snowflake",
    "Draw a Christmas scene",
    "Write a Christmas poem"
  ];

  const christmasPenalties = [
    "Wear a Santa hat for a day",
    "Sing Jingle Bells in public",
    "Do a reindeer dance",
    "Tell three Christmas dad jokes",
    "Make hot chocolate for everyone",
    "Write a funny Christmas card"
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">🎄 Secret Santa's Fun Tasks 🎅</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Back to Workshop
          </button>
        </div>

        {/* Create Task Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-green-700">🎁 Create New Christmas Challenge</h2>
          <div className="mb-4 bg-red-50 p-4 rounded-lg">
            <p className="text-red-700 text-sm">
              Ho Ho Ho! Create a fun Christmas challenge for someone special! 
              The recipient won't know who assigned it - that's part of the magic! 🌟
            </p>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700">Challenge Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="mt-1 block w-full border-red-200 focus:border-green-500 focus:ring-green-500"
                required
                placeholder="Example: Spread Christmas cheer by..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="mt-1 block w-full border-red-200 focus:border-green-500 focus:ring-green-500"
                rows="3"
                required
                placeholder="Describe the task in detail..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700">Consequence</label>
              <input
                type="text"
                value={newTask.penalty}
                onChange={(e) => setNewTask({ ...newTask, penalty: e.target.value })}
                className="mt-1 block w-full border-red-200 focus:border-green-500 focus:ring-green-500"
                required
                placeholder="What happens if not completed..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700">Scheduled Date</label>
                <input
                  type="date"
                  value={newTask.scheduledDate}
                  onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                  className="mt-1 block w-full border-red-200 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700">Assign To</label>
                <select
                  value={newTask.assignTo}
                  onChange={(e) => setNewTask({ ...newTask, assignTo: e.target.value })}
                  className="mt-1 block w-full border-red-200 focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="">Select a Person</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
            >
              🎄 Assign Challenge! 🎁
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-200">
          <table className="min-w-full divide-y divide-red-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  🎄 Christmas Challenge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  ⭐ Spirit Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  🎅 Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  🎁 Holiday Forfeit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-red-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-red-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${task.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                        task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {task.difficulty === 'easy' ? '🧝 Elf Level' : 
                       task.difficulty === 'medium' ? '🦌 Reindeer Level' : 
                       '🎅 Santa Level'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {task.assigned_to_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {task.penalty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage; 