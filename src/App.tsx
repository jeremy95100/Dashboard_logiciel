import { useState } from 'react';
import './App.enhanced.css';
import ContactDashboard from './components/ContactDashboard.enhanced';
import CallDashboard from './components/CallDashboard.enhanced';
import ConversationDashboard from './components/ConversationDashboard.enhanced';
// import SociogramDashboard from './components/SociogramDashboard'; // Version avec Plotly
// import SociogramDashboard from './components/SociogramDashboard_Alternative'; // Version SVG native
import SociogramDashboard from './components/SociogramDashboard_Enhanced'; // Version Enhanced 3D

type MenuItem =
  | 'contacts'
  | 'calls'
  | 'conversations'
  | 'sociogram';

function App() {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('contacts');

  const renderContent = () => {
    switch (activeMenu) {
      case 'contacts':
        return <ContactDashboard />;
      case 'calls':
        return <CallDashboard />;
      case 'conversations':
        return <ConversationDashboard />;
      case 'sociogram':
        return <SociogramDashboard />;
      default:
        return <ContactDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <div className="navbar-brand">Cellebrite Analytics</div>
      </div>

      {/* Main Wrapper for Sidebar and Content */}
      <div className="main-wrapper">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Navigation</div>

            <button
              className={activeMenu === 'contacts' ? 'active' : ''}
              onClick={() => setActiveMenu('contacts')}
            >
              <span className="nav-icon">👥</span>
              <span>Contacts</span>
            </button>

            <button
              className={activeMenu === 'calls' ? 'active' : ''}
              onClick={() => setActiveMenu('calls')}
            >
              <span className="nav-icon">📞</span>
              <span>Appels</span>
            </button>

            <button
              className={activeMenu === 'conversations' ? 'active' : ''}
              onClick={() => setActiveMenu('conversations')}
            >
              <span className="nav-icon">💬</span>
              <span>Messages</span>
            </button>

            <button
              className={activeMenu === 'sociogram' ? 'active' : ''}
              onClick={() => setActiveMenu('sociogram')}
            >
              <span className="nav-icon">🕸️</span>
              <span>Sociogramme</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
