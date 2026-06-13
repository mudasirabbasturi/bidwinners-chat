import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ProjectChat from './pages/Chat/ProjectChat';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to hash change for URL-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#chat\/(\d+)$/);
      if (match) {
        setActiveProjectId(parseInt(match[1], 10));
      } else {
        setActiveProjectId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const activeProject = projectsList.find(p => p.id === activeProjectId);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        activeProjectId={activeProjectId}
        onProjectsLoaded={setProjectsList}
      />
      <main className={`main-content ${!sidebarOpen && !isMobile ? 'expanded' : ''}`}>
        {activeProjectId ? (
          <ProjectChat 
            projectId={activeProjectId} 
            project={activeProject} 
          />
        ) : (
          <>
            {/* Main chat area header */}
            {!sidebarOpen && (
              <div className="main-header">
                <h2>Chat.bidwinners</h2>
              </div>
            )}

            {/* Empty state */}
            <div className="empty-main">
              <div className="empty-main-content">
                <h2>Select a conversation</h2>
                <p>Choose a chat from the sidebar or start a new one</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;