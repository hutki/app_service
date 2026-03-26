import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, filesAPI, messagesAPI, ticketsAPI } from '../services/api';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Attachment as AttachmentIcon,
  CameraAlt as CameraIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';

const statusOptions = [
  { label: 'Новая', value: 'new' },
  { label: 'В работе', value: 'in progress' },
  { label: 'Завершена', value: 'completed' },
  { label: 'Отклонена', value: 'rejected' }
];

const roleLabels = {
  admin: 'администратор',
  manager: 'менеджер',
  engineer: 'инженер',
  client: 'клиент'
};

const getStatusLabel = (status) => {
  const statusOption = statusOptions.find((option) => option.value === status);
  return statusOption ? statusOption.label : status;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'primary';
    case 'in progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [photoUrls, setPhotoUrls] = useState({});

  const [newMessage, setNewMessage] = useState('');
  const [messageAttachments, setMessageAttachments] = useState([]);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assignmentUpdating, setAssignmentUpdating] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const [deletingAttachmentId, setDeletingAttachmentId] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState('');

  const [editingDescription, setEditingDescription] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const canEditStatus = ['admin', 'manager', 'engineer'].includes(user?.role);
  const canAssignTicket = ['admin', 'manager'].includes(user?.role);
  const canDeleteTicket = ['admin', 'manager'].includes(user?.role);
  const canDeleteTicketFiles = user?.role === 'admin' || ticket?.createdBy?._id === user?._id;
  const canEditDescription =
    ['admin', 'manager', 'engineer'].includes(user?.role) ||
    ticket?.createdBy?._id === user?._id;

  const fetchTicketDetails = async ({ withLoader = true } = {}) => {
    try {
      if (withLoader) {
        setLoading(true);
      }

      const [ticketResponse, messagesResponse] = await Promise.all([
        ticketsAPI.getById(id),
        messagesAPI.getByTicketId(id)
      ]);

      setTicket(ticketResponse.data);
      setMessages(messagesResponse.data);
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Не удалось загрузить заявку');
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  useEffect(() => {
    if (ticket && !editingDescription) {
      setDescriptionDraft(ticket.description);
    }
  }, [ticket, editingDescription]);

  useEffect(() => {
    if (!canAssignTicket) {
      return;
    }

    const fetchStaffUsers = async () => {
      try {
        const response = await authAPI.getUsers('admin,manager,engineer');
        setStaffUsers(response.data);
      } catch (error) {
        setStatusError(error.response?.data?.message || 'Не удалось загрузить список сотрудников');
      }
    };

    fetchStaffUsers();
  }, [canAssignTicket]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTicketDetails({ withLoader: false });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const objectUrls = [];

    const loadPhotoUrls = async () => {
      if (!ticket?.acceptancePhotos?.length) {
        setPhotoUrls({});
        return;
      }

      try {
        const entries = await Promise.all(
          ticket.acceptancePhotos.map(async (photo) => {
            const response = await filesAPI.download(photo.filename);
            const objectUrl = URL.createObjectURL(response.data);
            objectUrls.push(objectUrl);
            return [photo.filename, objectUrl];
          })
        );

        if (isMounted) {
          setPhotoUrls(Object.fromEntries(entries));
        }
      } catch (error) {
        if (isMounted) {
          setUploadError('Фотографии загружены, но предпросмотр не открылся');
        }
      }
    };

    loadPhotoUrls();

    return () => {
      isMounted = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [ticket?.acceptancePhotos]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !messageAttachments.length) {
      return;
    }

    try {
      setSending(true);
      setUploadError('');
      setUploadSuccess('');

      const response = await messagesAPI.send({
        ticketId: id,
        content: newMessage.trim() || 'Вложение'
      });

      for (const file of messageAttachments) {
        const formData = new FormData();
        formData.append('attachment', file);
        await messagesAPI.addAttachment(response.data._id, formData);
      }

      await fetchTicketDetails({ withLoader: false });
      setNewMessage('');
      setMessageAttachments([]);
      setUploadSuccess('Сообщение отправлено');
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const handleMessageAttachmentChange = (event) => {
    setMessageAttachments(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!ticket || ticket.status === nextStatus) {
      return;
    }

    try {
      setStatusUpdating(true);
      setStatusError('');
      setStatusSuccess('');

      const response = await ticketsAPI.update(ticket._id, { status: nextStatus });
      setTicket(response.data);
      setStatusSuccess(`Статус изменён: "${getStatusLabel(nextStatus)}"`);
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Не удалось обновить статус заявки');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssigneeUpdate = async (nextAssignee) => {
    if (!ticket) {
      return;
    }

    const currentAssignee = ticket.assignedTo?._id || '';
    if (currentAssignee === nextAssignee) {
      return;
    }

    try {
      setAssignmentUpdating(true);
      setStatusError('');
      setStatusSuccess('');

      const response = await ticketsAPI.update(ticket._id, {
        assignedTo: nextAssignee || null
      });

      setTicket(response.data);
      setStatusSuccess(nextAssignee ? 'Исполнитель обновлён' : 'Исполнитель снят');
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Не удалось обновить исполнителя');
    } finally {
      setAssignmentUpdating(false);
    }
  };

  const handleAttachmentUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length || !ticket) {
      return;
    }

    try {
      setUploadingAttachment(true);
      setUploadError('');
      setUploadSuccess('');

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('attachment', file);
        await ticketsAPI.addAttachment(ticket._id, formData);
      }

      await fetchTicketDetails({ withLoader: false });
      setUploadSuccess(`Загружено вложений: ${selectedFiles.length}`);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Не удалось загрузить вложение');
    } finally {
      event.target.value = '';
      setUploadingAttachment(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length || !ticket) {
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadError('');
      setUploadSuccess('');

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('photo', file);
        await ticketsAPI.addPhoto(ticket._id, formData);
      }

      await fetchTicketDetails({ withLoader: false });
      setUploadSuccess(`Загружено фото: ${selectedFiles.length}`);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Не удалось загрузить фото');
    } finally {
      event.target.value = '';
      setUploadingPhoto(false);
    }
  };

  const handleFileDownload = async (filename) => {
    try {
      const response = await filesAPI.download(filename);
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setUploadError('Не удалось скачать файл');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Удалить это сообщение?')) {
      return;
    }

    try {
      setDeletingMessageId(messageId);
      setUploadError('');
      setUploadSuccess('');

      await messagesAPI.delete(messageId);
      setMessages((currentMessages) => currentMessages.filter((message) => message._id !== messageId));
      setUploadSuccess('Сообщение удалено');
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Не удалось удалить сообщение');
    } finally {
      setDeletingMessageId('');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Удалить этот документ?')) {
      return;
    }

    try {
      setDeletingAttachmentId(attachmentId);
      setUploadError('');
      setUploadSuccess('');

      const response = await ticketsAPI.deleteAttachment(ticket._id, attachmentId);
      setTicket((currentTicket) => ({
        ...currentTicket,
        attachments: response.data.attachments
      }));
      setUploadSuccess('Документ удалён');
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Не удалось удалить документ');
    } finally {
      setDeletingAttachmentId('');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Удалить это фото?')) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      setUploadError('');
      setUploadSuccess('');

      const response = await ticketsAPI.deletePhoto(ticket._id, photoId);
      setTicket((currentTicket) => ({
        ...currentTicket,
        acceptancePhotos: response.data.acceptancePhotos
      }));
      setUploadSuccess('Фото удалено');
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Не удалось удалить фото');
    } finally {
      setDeletingPhotoId('');
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm(`Удалить заявку ${ticket.ticketNumber}? Все сообщения тоже будут удалены.`)) {
      return;
    }

    try {
      setDeletingTicket(true);
      setStatusError('');
      setStatusSuccess('');
      await ticketsAPI.delete(ticket._id);
      navigate('/');
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Не удалось удалить заявку');
    } finally {
      setDeletingTicket(false);
    }
  };

  const handleStartDescriptionEdit = () => {
    setDescriptionDraft(ticket?.description || '');
    setEditingDescription(true);
    setStatusError('');
    setStatusSuccess('');
  };

  const handleCancelDescriptionEdit = () => {
    setDescriptionDraft(ticket?.description || '');
    setEditingDescription(false);
  };

  const handleSaveDescription = async () => {
    const normalizedDescription = descriptionDraft.trim();

    if (normalizedDescription.length < 10) {
      setStatusError('Описание должно содержать минимум 10 символов');
      return;
    }

    if (normalizedDescription === ticket.description) {
      setEditingDescription(false);
      return;
    }

    try {
      setSavingDescription(true);
      setStatusError('');
      setStatusSuccess('');

      const response = await ticketsAPI.update(ticket._id, {
        description: normalizedDescription
      });

      setTicket(response.data);
      setEditingDescription(false);
      setStatusSuccess('Описание обновлено');
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Не удалось обновить описание');
    } finally {
      setSavingDescription(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" align="center">
          Заявка не найдена
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Заявка {ticket.ticketNumber}
        </Typography>
        <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status)} sx={{ ml: 2 }} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Детали заявки"
              subheader={`Создана: ${new Date(ticket.createdAt).toLocaleString()}`}
            />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Typography variant="h6">Описание</Typography>
                {canEditDescription && !editingDescription && (
                  <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={handleStartDescriptionEdit}>
                    Редактировать
                  </Button>
                )}
              </Box>

              {editingDescription ? (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    value={descriptionDraft}
                    onChange={(event) => setDescriptionDraft(event.target.value)}
                    helperText={`${descriptionDraft.trim().length} символов`}
                    disabled={savingDescription}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                    <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleCancelDescriptionEdit} disabled={savingDescription}>
                      Отмена
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={savingDescription ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveDescription}
                      disabled={savingDescription}
                    >
                      {savingDescription ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" paragraph>
                  {ticket.description}
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Автор: {ticket.createdBy?.username || 'Неизвестно'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Исполнитель: {ticket.assignedTo?.username || 'Не назначен'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Технические материалы
              </Typography>
              {ticket.attachments?.length ? (
                <List>
                  {ticket.attachments.map((attachment, index) => (
                    <ListItem key={attachment._id || index}>
                      <ListItemAvatar>
                        <Avatar>
                          <AttachmentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={attachment.filename}
                        secondary={`Загружено: ${new Date(attachment.uploadedAt).toLocaleString()}`}
                      />
                      <Button variant="outlined" size="small" onClick={() => handleFileDownload(attachment.filename)}>
                        Скачать
                      </Button>
                      {canDeleteTicketFiles && (
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteAttachment(attachment._id)}
                          disabled={deletingAttachmentId === attachment._id}
                        >
                          {deletingAttachmentId === attachment._id ? <CircularProgress size={18} /> : <DeleteIcon />}
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">Нет прикреплённых технических материалов</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Фото приёмки
              </Typography>
              {ticket.acceptancePhotos?.length ? (
                <Grid container spacing={2}>
                  {ticket.acceptancePhotos.map((photo, index) => (
                    <Grid item xs={6} sm={4} key={photo._id || index}>
                      <Box>
                        <img
                          src={photoUrls[photo.filename]}
                          alt="Фото приёмки"
                          style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                        />
                        {canDeleteTicketFiles && (
                          <Button
                            color="error"
                            size="small"
                            startIcon={deletingPhotoId === photo._id ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" />}
                            onClick={() => handleDeletePhoto(photo._id)}
                            disabled={deletingPhotoId === photo._id}
                            sx={{ mt: 1 }}
                          >
                            Удалить
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="textSecondary">Фото приёмки не загружены</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Сообщения" />
            <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message._id}
                    alignItems="flex-start"
                    sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {message.senderId?.username || 'Неизвестный пользователь'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        {(message.senderId?._id === user?._id || ['admin', 'manager', 'engineer'].includes(user?.role)) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMessage(message._id)}
                            disabled={deletingMessageId === message._id}
                          >
                            {deletingMessageId === message._id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" paragraph>
                      {message.content}
                    </Typography>
                    {message.attachments?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {message.attachments.map((attachment, index) => (
                          <Chip
                            key={attachment._id || index}
                            icon={<AttachmentIcon />}
                            label={attachment.filename}
                            size="small"
                            onClick={() => handleFileDownload(attachment.filename)}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <Divider />
            <CardContent>
              <Paper sx={{ p: 1, display: 'flex' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Введите сообщение или приложите файлы..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  disabled={sending}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !messageAttachments.length) || sending}
                  sx={{ ml: 1 }}
                >
                  {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Paper>

              {messageAttachments.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {messageAttachments.map((file) => (
                    <Chip
                      key={`${file.name}-${file.size}`}
                      icon={<AttachmentIcon />}
                      label={file.name}
                      size="small"
                      onDelete={() => {
                        setMessageAttachments((currentFiles) => currentFiles.filter((currentFile) => currentFile !== file));
                      }}
                    />
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small" disabled={sending}>
                  Прикрепить файл
                  <input type="file" hidden multiple onChange={handleMessageAttachmentChange} />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  variant="outlined"
                  startIcon={sending ? <CircularProgress size={18} /> : <SendIcon />}
                  size="small"
                  disabled={(!newMessage.trim() && !messageAttachments.length) || sending}
                >
                  Отправить
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        {(statusError || statusSuccess || uploadError || uploadSuccess) && (
          <Alert
            severity={statusError || uploadError ? 'error' : 'success'}
            sx={{ mb: 2 }}
            onClose={() => {
              setStatusError('');
              setStatusSuccess('');
              setUploadError('');
              setUploadSuccess('');
            }}
          >
            {statusError || uploadError || statusSuccess || uploadSuccess}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={uploadingAttachment ? <CircularProgress size={18} /> : <CloudUploadIcon />}
              size="small"
              disabled={uploadingAttachment || uploadingPhoto}
            >
              {uploadingAttachment ? 'Загрузка файлов...' : 'Прикрепить файл'}
              <input type="file" hidden multiple onChange={handleAttachmentUpload} />
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={uploadingPhoto ? <CircularProgress size={18} /> : <CameraIcon />}
              size="small"
              disabled={uploadingAttachment || uploadingPhoto}
            >
              {uploadingPhoto ? 'Загрузка фото...' : 'Добавить фото'}
              <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canDeleteTicket && (
              <Button
                variant="outlined"
                color="error"
                startIcon={deletingTicket ? <CircularProgress size={18} /> : <DeleteIcon />}
                onClick={handleDeleteTicket}
                disabled={deletingTicket}
              >
                {deletingTicket ? 'Удаление заявки...' : 'Удалить заявку'}
              </Button>
            )}

            {canAssignTicket && (
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="ticket-assignee-label">Исполнитель</InputLabel>
                <Select
                  labelId="ticket-assignee-label"
                  value={ticket.assignedTo?._id || ''}
                  label="Исполнитель"
                  onChange={(event) => handleAssigneeUpdate(event.target.value)}
                  disabled={assignmentUpdating}
                >
                  <MenuItem value="">Не назначен</MenuItem>
                  {staffUsers.map((staffUser) => (
                    <MenuItem key={staffUser._id} value={staffUser._id}>
                      {staffUser.username} ({roleLabels[staffUser.role] || staffUser.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {canEditStatus ? (
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="ticket-status-label">Статус заявки</InputLabel>
                <Select
                  labelId="ticket-status-label"
                  value={ticket.status}
                  label="Статус заявки"
                  onChange={(event) => handleStatusUpdate(event.target.value)}
                  disabled={statusUpdating}
                >
                  {statusOptions.map((statusOption) => (
                    <MenuItem key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Только менеджеры, инженеры и администраторы могут менять статус заявки.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default TicketDetail;
