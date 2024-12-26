import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUsers, setNewUsers] = useState([{ full_name: '', email: '' }]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPairings, setShowPairings] = useState(false);
  const [pairings, setPairings] = useState([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [revealStatus, setRevealStatus] = useState(false);

  const handleAddUserField = () => {
    setNewUsers([...newUsers, { full_name: '', email: '' }]);
  };

  const handleUserInputChange = (index, field, value) => {
    const updatedUsers = [...newUsers];
    updatedUsers[index][field] = value;
    setNewUsers(updatedUsers);
  };

  const clearForm = () => {
    setNewUsers([{ full_name: '', email: '' }]);
    setMessage('');
    setError('');
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all user data? This cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/admin/clear-data', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers([]);
        clearForm();
        setMessage('All data cleared successfully!');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to clear data');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      setError('Please upload a valid CSV or Excel file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          setError('The file is empty');
          return;
        }

        // Validate required columns
        const requiredColumns = ['full_name', 'email'];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const formattedUsers = data.map(row => ({
          full_name: (row.full_name || '').toString().trim(),
          email: (row.email || '').toString().trim()
        })).filter(user => user.full_name && user.email); // Filter out empty entries

        if (formattedUsers.length === 0) {
          setError('No valid user data found in file');
          return;
        }

        setNewUsers(formattedUsers);
        setMessage('File imported successfully!');
        setError('');
      } catch (err) {
        setError('Failed to parse file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsBinaryString(file);
  };

  const handleRegisterUsers = async () => {
    // Validate users data
    const invalidUsers = newUsers.filter(user => !user.full_name.trim() || !user.email.trim());
    if (invalidUsers.length > 0) {
      setError('All users must have both name and email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/admin/register-users',
        { users: newUsers },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.error) {
        setError(response.data.error);
        if (response.data.details) {
          setError(`${response.data.error}: ${response.data.details.join(', ')}`);
        }
      } else {
        setUsers(response.data.users);
        setMessage('Users registered successfully!');
        clearForm();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register users');
    }
  };

  const handleCreatePairings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/admin/create-pairings',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage('Pairings created successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create pairings');
    }
  };

  const handleRevealPairings = async () => {
    if (window.confirm('Are you sure you want to reveal all Secret Santa pairings? This should only be done on Christmas!')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/pairings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPairings(response.data.pairings);
        setShowPairings(true);
      } catch (err) {
        setError('Failed to fetch pairings');
      }
    }
  };

  const handleToggleReveal = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/toggle-reveal', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsRevealed(response.data.revealed);
      setMessage(response.data.revealed ? 
        '🎄 Secret Santas have been revealed to everyone!' : 
        'Secret Santas are now hidden again.'
      );
    } catch (err) {
      setError('Failed to toggle reveal status');
    }
  };

  const fetchAllTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllTasks(response.data.tasks);
    } catch (err) {
      setError('Failed to fetch tasks');
    }
  };

  const exportTasksToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allTasks.map(task => ({
      Title: task.title,
      Description: task.description,
      Difficulty: task.difficulty,
      AssignedTo: task.assigned_to_name,
      Penalty: task.penalty,
      Status: task.status
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Christmas Tasks');
    XLSX.writeFile(workbook, 'christmas_tasks.xlsx');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {message && <div className="bg-green-100 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Register New Users</h2>
        
        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Users from Excel/CSV
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="mt-2 text-sm text-gray-600">
          <p className="font-semibold">CSV/Excel File Format:</p>
          <p>The file should have the following columns:</p>
          <ul className="list-disc ml-5 mt-1">
            <li>full_name (required): The full name of the user</li>
            <li>email (required): The email address of the user</li>
          </ul>
          <p className="mt-2">Example CSV content:</p>
          <pre className="bg-gray-100 p-2 rounded mt-1">
            full_name,email
            John Doe,john@example.com
            Jane Smith,jane@example.com
          </pre>
        </div>

        {/* Manual Entry Form */}
        {newUsers.map((user, index) => (
          <div key={index} className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Full Name"
              value={user.full_name}
              onChange={(e) => handleUserInputChange(index, 'full_name', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={user.email}
              onChange={(e) => handleUserInputChange(index, 'email', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
          </div>
        ))}
        
        <div className="flex gap-4">
          <button
            onClick={handleAddUserField}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Another User
          </button>
          <button
            onClick={handleRegisterUsers}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Register Users
          </button>
          <button
            onClick={clearForm}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Clear Form
          </button>
          <button
            onClick={clearAllData}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear All Data
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create Pairings</h2>
        <button
          onClick={handleCreatePairings}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Create Random Pairings
        </button>
      </div>

      <div className="mt-6 bg-red-50 p-6 rounded-lg border-2 border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-700">🎄 Christmas Day Reveal 🎅</h2>
        <p className="text-gray-700 mb-4">
          This special button reveals all Secret Santa pairings. Only use this on Christmas Day!
        </p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRevealPairings}
            className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transform hover:scale-105 transition-all"
          >
            🎁 View All Secret Santas! 🎄
          </button>
          <button
            onClick={handleToggleReveal}
            className={`px-6 py-3 rounded-full transform hover:scale-105 transition-all
              ${isRevealed ? 
                'bg-yellow-500 hover:bg-yellow-600' : 
                'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {isRevealed ? 
              '🎅 Hide Secret Santas' : 
              '🎄 Reveal to Everyone!'}
          </button>
        </div>

        {showPairings && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-green-700">Secret Santa Pairings:</h3>
            <div className="bg-white rounded-lg p-4">
              {pairings.map((pair, index) => (
                <div key={index} className="mb-2 p-3 border-b border-red-100 last:border-0">
                  <span className="text-red-600">🎅 {pair.santa_name}</span>
                  <span className="mx-2 text-gray-400">is Secret Santa for</span>
                  <span className="text-green-600">🎁 {pair.recipient_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Tasks Management</h2>
        <div className="flex gap-4">
          <button
            onClick={fetchAllTasks}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Fetch All Tasks
          </button>
          <button
            onClick={exportTasksToExcel}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export Tasks to Excel
          </button>
        </div>
        {allTasks.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Total Tasks: {allTasks.length}
            </p>
            {/* You can add a task preview table here if needed */}
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
          <div className="bg-yellow-100 p-4 rounded-lg mb-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> Initial password for each user is their email address.
              Users will be prompted to change their password on first login.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Initial Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-6 py-4">{user.full_name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">Same as email address</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
