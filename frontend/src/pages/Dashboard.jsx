import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = ({ onNavigateToItems }) => {
  const { token, logout, user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    recentItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/dashboard`); {
        headers: {
          'Authorization'; `Bearer ${token}`,
          'Content-Type'; 'application/json'
        }
      };

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard metrics');
      }

      setStats(data);

      const lowStockItems = data.recentItems.filter(item => item.quantity <= item.threshold);
      if (lowStockItems.length > 0) {
        setAlerts(lowStockItems);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert._id !== id));
  };

  if (loading) {
    return <div style={styles.loading}>Loading Dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Toast Alert Banner Stack */}
      {alerts.length > 0 && (
        <div style={styles.alertContainer}>
          {alerts.map((item) => (
            <div key={item._id} style={styles.alertBox}>
              <div>
                <strong>⚠️ Inventory Alert:</strong> Item <strong>{item.name}</strong> ({item.sku}) is {item.quantity === 0 ? 'Out of Stock' : 'Low on Stock'} ({item.quantity} remaining).
              </div>
              <button onClick={() => dismissAlert(item._id)} style={styles.dismissBtn}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Header Bar */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Inventory Dashboard</h1>
        <div style={styles.userInfo}>
          <button onClick={onNavigateToItems} style={styles.manageBtn}>
            Manage All Items →
          </button>
          <span style={styles.userEmail}>{user?.email || 'User'}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* KPI Cards Row */}
      <div style={styles.cardGrid}>
        <div style={{ ...styles.card, borderLeft: '5px solid #2563eb' }}>
          <span style={styles.cardLabel}>Total Items</span>
          <h2 style={styles.cardValue}>{stats.totalItems}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: '5px solid #eab308' }}>
          <span style={styles.cardLabel}>Low Stock Alert</span>
          <h2 style={{ ...styles.cardValue, color: '#ca8a04' }}>{stats.lowStockCount}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: '5px solid #dc2626' }}>
          <span style={styles.cardLabel}>Out of Stock</span>
          <h2 style={{ ...styles.cardValue, color: '#dc2626' }}>{stats.outOfStockCount}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: '5px solid #16a34a' }}>
          <span style={styles.cardLabel}>Total Inventory Value</span>
          <h2 style={{ ...styles.cardValue, color: '#16a34a' }}>
            ${Number(stats.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* Recent Items Section */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>Recently Added Items</h3>
        {stats.recentItems.length === 0 ? (
          <p style={styles.emptyText}>No items added yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentItems.map((item) => (
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
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: item.status === 'In Stock' ? '#dcfce7' : item.status === 'Low Stock' ? '#fef9c3' : '#fee2e2',
                      color: item.status === 'In Stock' ? '#166534' : item.status === 'Low Stock' ? '#854d0e' : '#991b1b'
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    color: '#0f172a'
  },
  alertContainer: {
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  alertBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center'
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: '#991b1b',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  header: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  headerTitle: {
    margin: 0,
    color: '#0f172a'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userEmail: {
    fontWeight: 'bold',
    color: '#334155'
  },
  manageBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.25rem',
    color: '#0f172a'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600'
  },
  cardValue: {
    margin: '0.5rem 0 0 0',
    fontSize: '1.875rem',
    color: '#0f172a'
  },
  tableCard: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    color: '#0f172a'
  },
  emptyText: {
    color: '#64748b'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thRow: {
    borderBottom: '2px solid #e2e8f0',
    textAlign: 'left'
  },
  th: {
    padding: '0.75rem',
    color: '#475569',
    fontSize: '0.875rem'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#0f172a'
  },
  badge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'inline-block'
  }
};

export default Dashboard;