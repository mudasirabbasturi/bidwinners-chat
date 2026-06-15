import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import ProjectChat from './pages/Chat/ProjectChat';
import DirectChat from './pages/Chat/DirectChat';
import './App.css';

function ProjectChatWrapper({ projectsList }) {
  const { projectId } = useParams();
  const id = projectId ? parseInt(projectId, 10) : null;
  const project = projectsList.find(p => p.id === id);

  if (!id) {
    return (
      <div className="empty-main">
        <div className="empty-main-content">
          <h2>Select a conversation</h2>
          <p>Choose a project from the sidebar</p>
        </div>
      </div>
    );
  }

  return <ProjectChat projectId={id} project={project} />;
}

function DirectChatWrapper() {
  const { partnerId } = useParams();
  const id = partnerId ? parseInt(partnerId, 10) : null;

  if (!id) {
    return (
      <div className="empty-main">
        <div className="empty-main-content">
          <h2>Select a conversation</h2>
          <p>Choose a user from the sidebar to start direct chat</p>
        </div>
      </div>
    );
  }

  return <DirectChat partnerId={id} />;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onProjectsLoaded={setProjectsList}
      />
      <main className={`main-content ${!sidebarOpen && !isMobile ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/project-chat" replace />} />
          <Route path="/project-chat" element={<ProjectChatWrapper projectsList={projectsList} />} />
          <Route path="/project-chat/:projectId" element={<ProjectChatWrapper projectsList={projectsList} />} />
          <Route path="/direct-chat" element={<DirectChatWrapper />} />
          <Route path="/direct-chat/:partnerId" element={<DirectChatWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;