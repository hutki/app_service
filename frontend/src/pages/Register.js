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
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await authAPI.register({ username, email, password, role });
      const { token, ...userData } = response.data;

      login(userData, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось зарегистрироваться');
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
            <PersonAdd sx={{ fontSize: 40 }} />
          </Box>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Создание аккаунта
          </Typography>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Система заявок на оборудование
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Имя пользователя"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Электронная почта"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Роль</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={role}
                label="Роль"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="client">Клиент</MenuItem>
                <MenuItem value="engineer">Инженер</MenuItem>
                <MenuItem value="manager">Менеджер</MenuItem>
                <MenuItem value="admin">Администратор</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </Button>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                fullWidth
                variant="text"
              >
                Уже есть аккаунт? Войти
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
