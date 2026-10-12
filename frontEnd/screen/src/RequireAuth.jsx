import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from './api/client';

/** Blocks organizer routes unless a JWT is present. */
function RequireAuth({ children }) {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/org" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireAuth;
