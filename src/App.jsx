import { useState, useEffect } from 'react';

function App() {
  const [attendances, setAttendances] = useState([]);
  const [formData, setFormData] = useState({ studentName: '', date: '', className: '', status: 'present' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    const res = await fetch('http://localhost:5000/attendances');
    const data = await res.json();
    setAttendances(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `http://localhost:5000/attendances/${editingId}` : 'http://localhost:5000/attendances';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    fetchAttendances();
    setFormData({ studentName: '', date: '', className: '', status: 'present' });
    setEditingId(null);
  };

  const handleEdit = (att) => {
    setFormData({ studentName: att.studentName, date: att.date.slice(0,10), className: att.className, status: att.status });
    setEditingId(att._id);
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/attendances/${id}`, { method: 'DELETE' });
    fetchAttendances();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Attendance Tracker</h1>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <input type="text" placeholder="Student Name" value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} className="border p-2 mr-2" required />
        <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="border p-2 mr-2" required />
        <input type="text" placeholder="Class Name" value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="border p-2 mr-2" required />
        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="border p-2 mr-2">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2">{editingId ? 'Update' : 'Add'}</button>
      </form>
      
      {/* Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Student</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Class</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map(att => (
            <tr key={att._id}>
              <td className="border p-2">{att.studentName}</td>
              <td className="border p-2">{new Date(att.date).toLocaleDateString()}</td>
              <td className="border p-2">{att.className}</td>
              <td className="border p-2">{att.status}</td>
              <td className="border p-2">
                <button onClick={() => handleEdit(att)} className="bg-yellow-500 text-white p-1 mr-2">Edit</button>
                <button onClick={() => handleDelete(att._id)} className="bg-red-500 text-white p-1">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;