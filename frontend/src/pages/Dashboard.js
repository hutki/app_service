import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI } from '../services/api';
import {
  Alert,
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'engineer':
        return 'Инженер';
      case 'client':
        return 'Клиент';
      default:
        return role;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Новая';
      case 'in progress':
        return 'В работе';
      case 'completed':
        return 'Завершена';
      case 'rejected':
        return 'Отклонена';
      default:
        return status;
    }
  };

  const [tickets, setTickets] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dashboardError, setDashboardError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setDashboardError('');
      const response = await ticketsAPI.getAll();
      setTickets(response.data);
    } catch (error) {
      setDashboardError(error.response?.data?.message || 'Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTicket = () => {
    navigate('/tickets/new');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <AssignmentIcon color="primary" />;
      case 'in progress':
        return <BuildIcon color="warning" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    (ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || ticket.status === statusFilter) &&
    (assigneeFilter === 'all' || (ticket.assignedTo?._id || 'unassigned') === assigneeFilter)
  );

  const dashboardTitle = ['admin', 'manager', 'engineer'].includes(user?.role)
    ? 'Все заявки'
    : 'Мои заявки';

  const canUseAssigneeFilter = ['admin', 'manager', 'engineer'].includes(user?.role);
  const assigneeOptions = Array.from(new Map(
    tickets
      .filter((ticket) => ticket.assignedTo?._id)
      .map((ticket) => [ticket.assignedTo._id, ticket.assignedTo])
  ).values());
  const totalTickets = tickets.length;
  const newTicketsCount = tickets.filter((ticket) => ticket.status === 'new').length;
  const inProgressTicketsCount = tickets.filter((ticket) => ticket.status === 'in progress').length;
  const completedTicketsCount = tickets.filter((ticket) => ticket.status === 'completed').length;
  const unassignedTicketsCount = tickets.filter((ticket) => !ticket.assignedTo?._id).length;
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || assigneeFilter !== 'all';

  const statCards = [
    { label: 'Всего', value: totalTickets, color: 'default' },
    { label: 'Новые', value: newTicketsCount, color: 'primary' },
    { label: 'В работе', value: inProgressTicketsCount, color: 'warning' },
    { label: 'Завершённые', value: completedTicketsCount, color: 'success' }
  ];

  if (canUseAssigneeFilter) {
    statCards.push({ label: 'Без исполнителя', value: unassignedTicketsCount, color: 'secondary' });
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Сервис заявок на оборудование
          </Typography>
          <TextField
            size="small"
            placeholder="Поиск заявок..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2, backgroundColor: 'white', borderRadius: 1 }}
          />
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar>
              <PersonIcon />
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem>
              <Typography variant="subtitle1">{user?.username}</Typography>
            </MenuItem>
            <MenuItem>
              <Typography variant="body2" color="textSecondary">
                {getRoleLabel(user?.role)}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {dashboardTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {canUseAssigneeFilter
                    ? 'Контроль входящих заявок, назначений и общего прогресса.'
                    : 'Отслеживайте свои заявки и их текущий статус.'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTicket}
              >
                Новая заявка
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              {statCards.map((statCard) => (
                <Grid item xs={6} sm={4} md={3} lg={statCards.length > 4 ? 2 : 3} key={statCard.label}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {statCard.label}
                      </Typography>
                      <Typography variant="h4">
                        {loading ? '...' : statCard.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="status-filter-label">Статус</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Статус"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">Все статусы</MenuItem>
                  <MenuItem value="new">Новая</MenuItem>
                  <MenuItem value="in progress">В работе</MenuItem>
                  <MenuItem value="completed">Завершена</MenuItem>
                  <MenuItem value="rejected">Отклонена</MenuItem>
                </Select>
              </FormControl>

              {canUseAssigneeFilter && (
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel id="assignee-filter-label">Исполнитель</InputLabel>
                  <Select
                    labelId="assignee-filter-label"
                    value={assigneeFilter}
                    label="Исполнитель"
                    onChange={(event) => setAssigneeFilter(event.target.value)}
                  >
                    <MenuItem value="all">Все исполнители</MenuItem>
                    <MenuItem value="unassigned">Без исполнителя</MenuItem>
                    {assigneeOptions.map((assignee) => (
                      <MenuItem key={assignee._id} value={assignee._id}>
                        {assignee.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Grid>

          {dashboardError && (
            <Grid item xs={12}>
              <Alert severity="error">{dashboardError}</Alert>
            </Grid>
          )}

          {loading ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <CircularProgress />
                  </Box>
                  <Typography variant="h6" align="center">
                    Загрузка заявок
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary">
                    Загружаем актуальные данные.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : filteredTickets.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" align="center" color="textSecondary">
                    Заявки не найдены
                  </Typography>
                  <Typography variant="body1" align="center" color="textSecondary">
                    {hasActiveFilters
                      ? 'Измените фильтры или поисковый запрос.'
                      : 'Создайте первую заявку, чтобы начать работу.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredTickets.map((ticket) => (
              <Grid item xs={12} sm={6} md={4} key={ticket._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {ticket.ticketNumber}
                      </Typography>
                      <Badge badgeContent={getStatusLabel(ticket.status)} color={
                        ticket.status === 'new' ? 'primary' :
                        ticket.status === 'in progress' ? 'warning' :
                        ticket.status === 'completed' ? 'success' : 'error'
                      }>
                        {getStatusIcon(ticket.status)}
                      </Badge>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {ticket.description.length > 100
                        ? `${ticket.description.substring(0, 100)}...`
                        : ticket.description}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Автор: {ticket.createdBy?.username || 'Неизвестно'}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Исполнитель: {ticket.assignedTo?.username || 'Не назначен'}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Создана: {new Date(ticket.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={ticket.assignedTo?.username ? `Ответственный: ${ticket.assignedTo.username}` : 'Требует назначения'}
                        color={ticket.assignedTo?.username ? 'default' : 'warning'}
                        variant={ticket.assignedTo?.username ? 'outlined' : 'filled'}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/ticket/${ticket._id}`)}
                    >
                      Открыть
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
