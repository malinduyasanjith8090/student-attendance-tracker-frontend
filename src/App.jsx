import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Explicitly import autoTable

function App() {
  const [attendances, setAttendances] = useState([]);
  const [formData, setFormData] = useState({ studentName: '', date: '', className: '', status: 'present' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({ className: '', date: '' });

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
    setTimeout(() => setToast(null), 3000);
  };

  // Calculate summary stats for cards
  const totalStudents = [...new Set(attendances.map(att => att.studentName))].length;
  const totalPresent = attendances.filter(att => att.status === 'present').length;
  const totalAbsent = attendances.filter(att => att.status === 'absent').length;
  const totalClasses = [...new Set(attendances.map(att => att.className))].length;

  // Filter attendances by search query
  const filteredAttendances = attendances.filter(att =>
    att.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique classes and dates for export modal
  const uniqueClasses = [...new Set(attendances.map(att => att.className))];
  const uniqueDates = [...new Set(attendances.map(att => att.date.slice(0, 10)))];

  // Handle PDF export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Student Attendance Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Class: ${exportFilters.className || 'All'}`, 20, 30);
    doc.text(`Date: ${exportFilters.date || 'All'}`, 20, 38);

    // Filter records based on modal inputs
    const exportData = attendances.filter(att => 
      (!exportFilters.className || att.className === exportFilters.className) &&
      (!exportFilters.date || att.date.slice(0, 10) === exportFilters.date)
    );

    // Table headers
    const headers = ['Student', 'Date', 'Class', 'Status'];
    const data = exportData.map(att => [
      att.studentName,
      new Date(att.date).toLocaleDateString(),
      att.className,
      att.status
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255] },
    });

    // Add Class Teacher's Name line
    const finalY = doc.lastAutoTable.finalY || 50;
    doc.text('Class Teacher\'s Name: _________________________', 20, finalY + 10);

    doc.save('attendance_report.pdf');
    setShowExportModal(false);
    setExportFilters({ className: '', date: '' });
    showToast('PDF exported successfully!', 'success');
  };

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
        
        {/* Search and Export Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Student Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-teal-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-teal-400 transition duration-200 placeholder-gray-400 w-full sm:w-64"
            />
            <button
              onClick={() => setSearchQuery(searchQuery)}
              className="bg-teal-600 text-white font-semibold text-sm py-2 px-4 rounded-lg hover:bg-teal-700 transition duration-200"
            >
              Search
            </button>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-blue-600 text-white font-semibold text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 w-full sm:w-auto"
          >
            Export to PDF
          </button>
        </div>
        
        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-teal-900 mb-4">Export Attendance Report</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-teal-800 mb-1">Select Class</label>
                <select
                  value={exportFilters.className}
                  onChange={(e) => setExportFilters({ ...exportFilters, className: e.target.value })}
                  className="w-full border-2 border-teal-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-teal-800 mb-1">Select Date</label>
                <select
                  value={exportFilters.date}
                  onChange={(e) => setExportFilters({ ...exportFilters, date: e.target.value })}
                  className="w-full border-2 border-teal-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">All Dates</option>
                  {uniqueDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-gray-300 text-gray-800 font-semibold text-sm py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-blue-600 text-white font-semibold text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
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
              {filteredAttendances.map(att => (
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