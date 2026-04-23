import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    itemName: '', description: '', type: 'Lost',
    location: '', date: '', contactInfo: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/items`, { headers });
      setItems(res.data);
    } catch { setError('Failed to load items'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editItem) {
        await axios.put(`${API}/items/${editItem._id}`, form, { headers });
        setSuccess('Item updated successfully!');
      } else {
        await axios.post(`${API}/items`, form, { headers });
        setSuccess('Item reported successfully!');
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ itemName: '', description: '', type: 'Lost', location: '', date: '', contactInfo: '' });
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      itemName: item.itemName,
      description: item.description,
      type: item.type,
      location: item.location,
      date: item.date?.split('T')[0] || '',
      contactInfo: item.contactInfo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API}/items/${id}`, { headers });
      setSuccess('Item deleted!');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { fetchItems(); return; }
    try {
      const res = await axios.get(`${API}/items/search?name=${searchQuery}`, { headers });
      setItems(res.data);
    } catch { setError('Search failed'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openAddModal = () => {
    setEditItem(null);
    setForm({ itemName: '', description: '', type: 'Lost', location: '', date: '', contactInfo: '' });
    setShowModal(true);
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">⬡ LOST &amp; FOUND</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="nav-user">👤 {user.name}</span>
          <button className="btn-logout" onClick={handleLogout}>LOGOUT</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Messages */}
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {/* Search + Add */}
        <div className="glass-card">
          <p className="section-title">⬡ Search Items</p>
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>SEARCH</button>
            <button className="btn-search" onClick={() => { setSearchQuery(''); fetchItems(); }}>RESET</button>
          </div>
          <button className="btn-add" onClick={openAddModal}>+ REPORT NEW ITEM</button>
        </div>

        {/* Items Grid */}
        <p className="section-title">⬡ All Reported Items ({items.length})</p>
        {items.length === 0 ? (
          <div className="empty-state">
            <p>NO ITEMS REPORTED YET</p>
          </div>
        ) : (
          <div className="items-grid">
            {items.map(item => (
              <div className="item-card" key={item._id}>
                <span className={`item-type-badge ${item.type === 'Lost' ? 'badge-lost' : 'badge-found'}`}>
                  {item.type}
                </span>
                <p className="item-name">{item.itemName}</p>
                <p className="item-desc">{item.description}</p>
                <div className="item-meta">
                  <span>📍 <strong>Location:</strong> {item.location}</span>
                  <span>📅 <strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</span>
                  <span>📞 <strong>Contact:</strong> {item.contactInfo}</span>
                  <span>👤 <strong>By:</strong> {item.postedBy?.name || 'Unknown'}</span>
                </div>
                {item.postedBy?._id === user.id && (
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => handleEdit(item)}>EDIT</button>
                    <button className="btn-delete" onClick={() => handleDelete(item._id)}>DELETE</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p className="modal-title">{editItem ? '⬡ UPDATE ITEM' : '⬡ REPORT ITEM'}</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name</label>
                  <input type="text" name="itemName" value={form.itemName}
                    onChange={handleChange} placeholder="e.g. Blue Backpack" required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={form.location}
                    onChange={handleChange} placeholder="e.g. Library Block B" required />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="date" value={form.date}
                    onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea name="description" value={form.description}
                    onChange={handleChange} placeholder="Describe the item..." rows={3} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Contact Info</label>
                  <input type="text" name="contactInfo" value={form.contactInfo}
                    onChange={handleChange} placeholder="Phone or Email" required />
                </div>
              </div>
              <button type="submit" className="btn-primary">
                {editItem ? 'UPDATE ITEM' : 'SUBMIT REPORT'}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                CANCEL
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}