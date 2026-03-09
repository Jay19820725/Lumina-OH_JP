import { useAuthContext } from '../store/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
