import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Event from './Event.jsx';
import RegistrationSys from './RegistrationSys.jsx';
import Sign from './Sign.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/:id" element={<Event />} />
      <Route path="/:id/register" element={<RegistrationSys />} />
      <Route path="/:id/signin" element={<Sign />} />
    </Routes>
  </BrowserRouter>
);
