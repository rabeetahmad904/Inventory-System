import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';

const MainApp = () => {
  const { user, loading } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading application...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return currentView === 'dashboard' ? (
    <Dashboard onNavigateToItems={() => setCurrentView('items')} />
  ) : (
    <Items onBackToDashboard={() => setCurrentView('dashboard')} />
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;