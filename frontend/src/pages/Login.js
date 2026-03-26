import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await authAPI.login({ email, password });
      const { token, ...userData } = response.data;

      login(userData, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LockOutlined sx={{ fontSize: 40 }} />
          </Box>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Система заявок на оборудование
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Вход в аккаунт
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Электронная почта"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>

            <Divider sx={{ my: 2 }}>ИЛИ</Divider>

            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button
                fullWidth
                variant="outlined"
              >
                Создать аккаунт
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
