import { Alert, Container } from '@mui/material';
import Loader from './Loader';
import useAccessPermissions from '../util/useAccessPermissions';

const RequireAccess = ({ permission, children }) => {
  const access = useAccessPermissions();
  const required = Array.isArray(permission) ? permission : [permission];

  if (!access.loaded) {
    return <Loader />;
  }
  if (access.error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">Não foi possível validar suas permissões de acesso.</Alert>
      </Container>
    );
  }
  if (!required.some((item) => access.can(item))) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="warning">Você não possui permissão para acessar este módulo.</Alert>
      </Container>
    );
  }
  return children;
};

export default RequireAccess;
