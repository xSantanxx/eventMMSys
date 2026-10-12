import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './Home.jsx';
import App from './App.jsx';
import Event from './Event.jsx';
import AttendeeEvent from './AttendeeEvent.jsx';
import RegistrationSys from './RegistrationSys.jsx';
import Sign from './Sign.jsx';
import RequireAuth from './RequireAuth.jsx';
import {
  LegacyCheckInRedirect,
  LegacyEventRedirect,
  LegacyRegisterRedirect,
} from './LegacyRedirects.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/org" element={<App />} />
      <Route
        path="/org/events/:id"
        element={
          <RequireAuth>
            <Event />
          </RequireAuth>
        }
      />
      <Route
        path="/org/events/:id/check-in"
        element={
          <RequireAuth>
            <Sign />
          </RequireAuth>
        }
      />

      <Route path="/e/:id" element={<AttendeeEvent />} />
      <Route path="/e/:id/register" element={<RegistrationSys />} />

      <Route path="/:id/register" element={<LegacyRegisterRedirect />} />
      <Route path="/:id/signin" element={<LegacyCheckInRedirect />} />
      <Route path="/:id" element={<LegacyEventRedirect />} />
    </Routes>
  </BrowserRouter>
);
