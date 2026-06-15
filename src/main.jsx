import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Auth/Login.jsx'

function Root() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);