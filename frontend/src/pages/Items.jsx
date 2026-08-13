import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Items = ({ onBackToDashboard }) => {
  const { token, logout, user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Role Checks
  const canManageItems = user?.role === 'admin' || user?.role === 'manager';
  const canDeleteItems = user?.role === 'admin';

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    threshold: 5,
    unitPrice: 0,
    supplier: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchItems();
  }, [page, search]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/items?page=${page}&limit=5&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch items');

      setItems(data.items);
      setPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditItemId(item._id);
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        threshold: item.threshold,
        unitPrice: item.unitPrice,
        supplier: item.supplier || '',
        imageUrl: item.imageUrl || ''
      });
    } else {
      setEditItemId(null);
      setFormData({
        sku: '',
        name: '',
        category: '',
        quantity: 0,
        threshold: 5,
        unitPrice: 0,
        supplier: '',
        imageUrl: ''
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editItemId 
        ? `http://localhost:5000/api/items/${editItemId}`
        : 'http://localhost:5000/api/items';

      const method = editItemId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setShowModal(false);
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV Export Feature
  const exportToCSV = () => {
    if (items.length === 0) return alert('No data available to export.');

    const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit Price', 'Status'];
    const rows = items.map(item => [
      `"${item.sku}"`,
      `"${item.name}"`,
      `"${item.category}"`,
      item.quantity,
      item.unitPrice,
      `"${item.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_report_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBackToDashboard} style={styles.backBtn}>← Dashboard</button>
          <h1 style={styles.title}>Inventory Items</h1>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userEmail}>{user?.email} ({user?.role || 'staff'})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <input
          type="text"
          placeholder="Search by SKU, Name, or Category..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={styles.searchInput}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} style={styles.csvBtn}>
            📥 Export CSV
          </button>
          {canManageItems && (
            <button onClick={() => handleOpenModal()} style={styles.addBtn}>
              + Add New Item
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <p style={styles.loadingText}>Loading items...</p>
        ) : items.length === 0 ? (
          <p style={styles.emptyText}>No items found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Status</th>
                {canManageItems && <th style={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} style={styles.tr}>
                  <td style={styles.td}>
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b' }}>No Img</div>
                    )}
                  </td>
                  <td style={styles.td}><strong>{item.sku}</strong></td>
                  <td style={styles.td}>{item.name}</td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>${item.unitPrice.toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: item.status === 'In Stock' ? '#dcfce7' : item.status === 'Low Stock' ? '#fef9c3' : '#fee2e2',
                      color: item.status === 'In Stock' ? '#166534' : item.status === 'Low Stock' ? '#854d0e' : '#991b1b'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  {canManageItems && (
                    <td style={styles.td}>
                      <button onClick={() => handleOpenModal(item)} style={styles.editBtn}>Edit</button>
                      {canDeleteItems && (
                        <button onClick={() => handleDelete(item._id)} style={styles.deleteBtn}>Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        <div style={styles.pagination}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)} 
            style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={styles.paginationText}>Page {page} of {pages || 1}</span>
          <button 
            disabled={page >= pages} 
            onClick={() => setPage(page + 1)} 
            style={{ ...styles.pageBtn, opacity: page >= pages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ color: '#0f172a', marginTop: 0 }}>{editItemId ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>SKU</label>
                <input
                  type="text"
                  required
                  disabled={!!editItemId}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.gridRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    style={styles.modalInput}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Threshold Alert</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                    style={styles.modalInput}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Unit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', color: '#0f172a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  title: { margin: 0, color: '#0f172a' },
  backBtn: { padding: '0.5rem 1rem', backgroundColor: '#cbd5e1', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userEmail: { fontWeight: 'bold', color: '#334155' },
  logoutBtn: { padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  controlsBar: { display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' },
  searchInput: { flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.95rem' },
  addBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  csvBtn: { padding: '0.75rem 1.25rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  tableCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  loadingText: { textAlign: 'center', color: '#64748b' },
  emptyText: { textAlign: 'center', color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { borderBottom: '2px solid #e2e8f0', textAlign: 'left' },
  th: { padding: '0.75rem', color: '#475569', fontSize: '0.875rem' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.75rem', fontSize: '0.875rem', color: '#0f172a' },
  badge: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' },
  editBtn: { marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  deleteBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' },
  paginationText: { color: '#0f172a', fontWeight: 'bold' },
  pageBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: '#334155', color: '#ffffff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '450px' },
  inputGroup: { marginBottom: '1rem' },
  gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' },
  modalInput: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' },
  cancelBtn: { padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  saveBtn: { padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }
};

export default Items;