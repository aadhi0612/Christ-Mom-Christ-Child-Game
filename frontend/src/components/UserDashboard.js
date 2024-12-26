import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SpinWheel from './SpinWheel';
import ChangePasswordModal from './ChangePasswordModal';
import SantaReveal from './SantaReveal';

const UserDashboard = () => {
  const [pairedUser, setPairedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [mySanta, setMySanta] = useState(null);
  const [showSantaReveal, setShowSantaReveal] = useState(false);

  useEffect(() => {
    fetchPairedInfo();
    fetchTasks();
    checkPasswordStatus();
    checkRevealStatus();
  }, []);

  const fetchPairedInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/paired-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPairedUser(response.data.paired_name);
    } catch (err) {
      setError('Failed to fetch paired user information');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (err) {
      setError('Failed to fetch tasks');
    }
  };

  const checkPasswordStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/check-password-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNeedsPasswordChange(response.data.needs_password_change);
    } catch (err) {
      setError('Failed to check password status');
    }
  };

  const checkRevealStatus = async () => {
    try {
      const response = await axios.get('/api/pairings/revealed');
      setIsRevealed(response.data.revealed);
      if (response.data.revealed) {
        fetchMySanta();
      }
    } catch (err) {
      console.error('Failed to check reveal status:', err);
    }
  };

  const fetchMySanta = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/my-santa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMySanta(response.data.santa_name);
    } catch (err) {
      console.error('Failed to fetch Santa:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (needsPasswordChange) {
    return <ChangePasswordModal onComplete={() => setNeedsPasswordChange(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100">
      <nav className="bg-red-600 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-white">🎄 Secret Santa's Workshop 🎅</h1>
            <button
              onClick={handleLogout}
              className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transform hover:scale-105 transition-all"
            >
              Return to North Pole
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Secret Santa Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">🎁 Your Secret Santa Mission</h2>
            <div className="text-center">
              <button
                onClick={() => setShowSpinWheel(true)}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transform hover:scale-105 transition-all"
              >
                🎄 Discover Your Christ Child! 🎁
              </button>
            </div>
          </div>

          {isRevealed && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200 mt-6">
              <h2 className="text-2xl font-semibold mb-4 text-green-700">
                🎄 Christmas Day Reveal! 🎅
              </h2>
              <button
                onClick={() => setShowSantaReveal(true)}
                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transform hover:scale-105 transition-all"
              >
                🎁 Discover Your Secret Santa! 🎄
              </button>
            </div>
          )}

          {showSantaReveal && (
            <SantaReveal onClose={() => setShowSantaReveal(false)} />
          )}

          {/* Christmas Tasks Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">🎅 Holiday Challenges</h2>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border-2 border-red-100 rounded-lg p-4 hover:bg-red-50 transition-colors"
                  >
                    <h3 className="font-semibold text-green-700">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${task.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                          task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {task.difficulty === 'easy' ? '🧝 Elf Level' : 
                         task.difficulty === 'medium' ? '🦌 Reindeer Level' : 
                         '🎅 Santa Level'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center">No holiday challenges yet! Check back soon! 🎄</p>
            )}
            <Link
              to="/tasks"
              className="mt-6 block text-center bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transform hover:scale-105 transition-all"
            >
              🎁 View All Holiday Challenges 🎄
            </Link>
          </div>
        </div>
      </div>

      {/* Festive Reveal Modal */}
      {showSpinWheel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="relative">
            <button
              onClick={() => setShowSpinWheel(false)}
              className="absolute -top-4 -right-4 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600"
            >
              ×
            </button>
            <SpinWheel onClose={() => setShowSpinWheel(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
