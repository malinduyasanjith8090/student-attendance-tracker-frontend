import { useState, useEffect } from 'react';

function App() {
  const [attendances, setAttendances] = useState([]);
  const [formData, setFormData] = useState({ studentName: '', date: '', className: '', status: 'present' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // For pop messages

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/attendances');
      if (!res.ok) throw new Error('Failed to fetch attendances');
      const data = await res.json();
      setAttendances(data);
    } catch (err) {
      setError(err.message);
      showToast('Error fetching attendances!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `http://localhost:5000/attendances/${editingId}` : 'http://localhost:5000/attendances';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      await fetchAttendances();
      setFormData({ studentName: '', date: '', className: '', status: 'present' });
      setEditingId(null);
      showToast(editingId ? 'Attendance updated successfully!' : 'Attendance added successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Error saving attendance!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (att) => {
    setFormData({ studentName: att.studentName, date: att.date.slice(0, 10), className: att.className, status: att.status });
    setEditingId(att._id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/attendances/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attendance');
      await fetchAttendances();
      showToast('Attendance deleted successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Error deleting attendance!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Auto-dismiss after 3 seconds
  };

  // Calculate summary stats for cards
  const totalStudents = [...new Set(attendances.map(att => att.studentName))].length;
  const totalPresent = attendances.filter(att => att.status === 'present').length;
  const totalAbsent = attendances.filter(att => att.status === 'absent').length;
  const totalClasses = [...new Set(attendances.map(att => att.className))].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-teal-50 to-white flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-teal-900 mb-6 text-center tracking-tight">
          Student Attendance Tracker
        </h1>
        
        {error && (
          <p className="text-red-600 font-medium text-sm sm:text-base bg-red-50 p-3 rounded-lg mb-6 text-center">
            {error}
          </p>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-teal-50 rounded-lg shadow-md p-4 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-teal-800 tracking-wide">Total Students</h2>
            <p className="text-2xl font-bold text-teal-900">{totalStudents}</p>
          </div>
          <div className="bg-teal-50 rounded-lg shadow-md p-4 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-teal-800 tracking-wide">Present</h2>
            <p className="text-2xl font-bold text-teal-900">{totalPresent}</p>
          </div>
          <div className="bg-teal-50 rounded-lg shadow-md p-4 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-teal-800 tracking-wide">Absent</h2>
            <p className="text-2xl font-bold text-teal-900">{totalAbsent}</p>
          </div>
          <div className="bg-teal-50 rounded-lg shadow-md p-4 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-teal-800 tracking-wide">Total Classes</h2>
            <p className="text-2xl font-bold text-teal-900">{totalClasses}</p>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Student Name" 
            value={formData.studentName} 
            onChange={(e) => setFormData({...formData, studentName: e.target.value})} 
            className="col-span-1 border-2 border-teal-200 rounded-lg p-3 text-base font-medium focus:outline-none focus:border-teal-400 transition duration-200 placeholder-gray-400" 
            required 
          />
          <input 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
            className="col-span-1 border-2 border-teal-200 rounded-lg p-3 text-base font-medium focus:outline-none focus:border-teal-400 transition duration-200" 
            required 
          />
          <input 
            type="text" 
            placeholder="Class Name" 
            value={formData.className} 
            onChange={(e) => setFormData({...formData, className: e.target.value})} 
            className="col-span-1 border-2 border-teal-200 rounded-lg p-3 text-base font-medium focus:outline-none focus:border-teal-400 transition duration-200 placeholder-gray-400" 
            required 
          />
          <select 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            className="col-span-1 border-2 border-teal-200 rounded-lg p-3 text-base font-medium focus:outline-none focus:border-teal-400 transition duration-200 bg-white"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
          <button 
            type="submit" 
            disabled={loading} 
            className="col-span-1 bg-teal-600 text-white font-semibold text-base py-3 rounded-lg hover:bg-teal-700 transition duration-200 disabled:bg-teal-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
          </button>
        </form>
        
        {loading && (
          <p className="text-teal-600 font-medium text-sm sm:text-base text-center mb-6 animate-pulse">
            Loading...
          </p>
        )}
        
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-teal-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-100 text-teal-900">
                <th className="border border-teal-200 p-4 text-left text-sm font-semibold tracking-wide">Student</th>
                <th className="border border-teal-200 p-4 text-left text-sm font-semibold tracking-wide">Date</th>
                <th className="border border-teal-200 p-4 text-left text-sm font-semibold tracking-wide">Class</th>
                <th className="border border-teal-200 p-4 text-left text-sm font-semibold tracking-wide">Status</th>
                <th className="border border-teal-200 p-4 text-left text-sm font-semibold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map(att => (
                <tr key={att._id} className="hover:bg-teal-50 transition duration-150">
                  <td className="border border-teal-200 p-4 text-sm font-medium">{att.studentName}</td>
                  <td className="border border-teal-200 p-4 text-sm font-medium">{new Date(att.date).toLocaleDateString()}</td>
                  <td className="border border-teal-200 p-4 text-sm font-medium">{att.className}</td>
                  <td className="border border-teal-200 p-4 text-sm font-medium capitalize">{att.status}</td>
                  <td className="border border-teal-200 p-4">
                    <button 
                      onClick={() => handleEdit(att)} 
                      disabled={loading} 
                      className="bg-amber-500 text-white font-semibold text-sm py-2 px-4 rounded-md mr-2 hover:bg-amber-600 transition duration-200 disabled:bg-amber-300 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(att._id)} 
                      disabled={loading} 
                      className="bg-red-500 text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-red-600 transition duration-200 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg text-white font-semibold text-sm sm:text-base animate-slide-up max-w-xs ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;