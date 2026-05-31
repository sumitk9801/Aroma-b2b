import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Toaster } from 'sonner';
import AppRouter from './router';
import { fetchCurrentUser } from './store/slices/authSlice';
import { LS_TOKEN_KEY } from './utils/constants';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Bootstrap: if there's a token in localStorage, validate it and load the user
    const token = localStorage.getItem(LS_TOKEN_KEY);
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        richColors
        expand={false}
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}
