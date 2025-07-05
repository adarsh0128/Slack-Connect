import { Routes, Route } from 'react-router-dom';
import { SlackProvider } from './contexts/SlackContext';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ScheduledMessages from './pages/ScheduledMessages';
import AuthSuccess from './pages/AuthSuccess';
import AuthError from './pages/AuthError';

function App() {
  return (
    <SlackProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scheduled" element={<ScheduledMessages />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/auth-error" element={<AuthError />} />
          </Routes>
        </main>
      </div>
    </SlackProvider>
  );
}

export default App;
