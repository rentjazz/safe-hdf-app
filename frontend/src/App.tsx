import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Stock } from './pages/Stock';
import { Appointments } from './pages/Appointments';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/stock" element={<Stock />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;