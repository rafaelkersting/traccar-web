import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

const DemoStartDialog = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/demo/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company: company || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível iniciar a demonstração.');
      }
      onCreated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" id="demo-start-form" onSubmit={handleSubmit}>
        <DialogTitle>Experimente o Kersting GPS</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Criaremos um ambiente temporário e isolado, sem solicitar senha. Seus dados não serão
            transformados em contato comercial automaticamente.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            required
            autoFocus
            fullWidth
            margin="dense"
            label="Nome"
            autoComplete="name"
            inputProps={{ maxLength: 128 }}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            required
            fullWidth
            margin="dense"
            type="email"
            label="E-mail"
            autoComplete="email"
            inputProps={{ maxLength: 254 }}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Empresa (opcional)"
            autoComplete="organization"
            inputProps={{ maxLength: 128 }}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim() || !email.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Iniciar demonstração
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default DemoStartDialog;
