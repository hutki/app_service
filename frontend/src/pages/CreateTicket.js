import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const MIN_DESCRIPTION_LENGTH = 10;

const CreateTicket = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedDescription = description.trim();
  const descriptionHelperText = useMemo(() => {
    if (!description) {
      return `Опишите заявку минимум в ${MIN_DESCRIPTION_LENGTH} символов`;
    }

    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      return `Добавьте ещё ${MIN_DESCRIPTION_LENGTH - trimmedDescription.length} симв.`;
    }

    return `${trimmedDescription.length} символов`;
  }, [description, trimmedDescription]);

  const handleAttachmentChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setAttachments(selectedFiles);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      setError(`Описание заявки должно содержать минимум ${MIN_DESCRIPTION_LENGTH} символов`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const ticketResponse = await ticketsAPI.create({
        description: trimmedDescription
      });

      const createdTicket = ticketResponse.data;

      for (const file of attachments) {
        const formData = new FormData();
        formData.append('attachment', file);
        await ticketsAPI.addAttachment(createdTicket._id, formData);
      }

      navigate(`/ticket/${createdTicket._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось создать заявку');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            Создание новой заявки
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Опишите потребность в оборудовании и при необходимости приложите файлы.
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Описание заявки"
                placeholder="Укажите, какое оборудование нужно, зачем оно требуется, сроки, требования к конфигурации и другую важную информацию."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={6}
                fullWidth
                required
                helperText={descriptionHelperText}
                error={Boolean(description) && trimmedDescription.length < MIN_DESCRIPTION_LENGTH}
              />

              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  disabled={submitting}
                >
                  Добавить файлы
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleAttachmentChange}
                  />
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Можно приложить спецификации, сметы, скриншоты или документы согласования.
                </Typography>

                {attachments.length > 0 && (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                    {attachments.map((file) => (
                      <Chip
                        key={`${file.name}-${file.size}`}
                        icon={<DescriptionIcon />}
                        label={`${file.name} (${Math.ceil(file.size / 1024)} KB)`}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || trimmedDescription.length < MIN_DESCRIPTION_LENGTH}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={18} sx={{ mr: 1, color: 'inherit' }} />
                      Создание...
                    </>
                  ) : (
                    'Создать заявку'
                  )}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateTicket;
