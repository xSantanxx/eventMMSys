import { Navigate, useParams } from 'react-router-dom';

export function LegacyEventRedirect() {
  const { id } = useParams();
  return <Navigate to={`/e/${id}`} replace />;
}

export function LegacyRegisterRedirect() {
  const { id } = useParams();
  return <Navigate to={`/e/${id}/register`} replace />;
}

export function LegacyCheckInRedirect() {
  const { id } = useParams();
  return <Navigate to={`/org/events/${id}/check-in`} replace />;
}
