import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tickets/new" element={<PrivateRoute><CreateTicket /></PrivateRoute>} />
          <Route path="/ticket/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
