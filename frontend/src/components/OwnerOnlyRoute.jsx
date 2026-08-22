import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isLearnerOwner } from '../constants/access';

export default function OwnerOnlyRoute({ children }) {
  const { user } = useAuth();
  return isLearnerOwner(user) ? children : <Navigate to="/" replace />;
}
