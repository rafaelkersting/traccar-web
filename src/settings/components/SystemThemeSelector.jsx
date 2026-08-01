import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { SYSTEM_THEMES } from '../../common/theme/systemThemes';

const previewStyles = (item) => {
  const dark = item.mode === 'dark';
  return {
    background: item.effects.pageGradient,
    backgroundColor: item.colors.background || (dark ? '#171717' : '#f6f7fb'),
    color: item.colors.text || (dark ? '#ffffff' : '#18213d'),
  };
};

const ThemePreview = ({ item }) => (
  <Box
    sx={{
      ...previewStyles(item),
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: item.layout.sidebarInset ? '31% 1fr' : '38% 1fr',
      height: 112,
      overflow: 'hidden',
      borderRadius: `${item.shape.cardRadius}px`,
      border: `1px solid ${item.colors.divider || 'rgba(127,127,127,0.24)'}`,
    }}
  >
    <Box
      sx={{
        p: 1,
        background: item.effects.loginGradient,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.7,
      }}
    >
      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: item.colors.secondary }} />
      <Box
        sx={{ width: '70%', height: 4, borderRadius: 3, bgcolor: 'currentColor', opacity: 0.9 }}
      />
      <Box
        sx={{
          width: '88%',
          height: 12,
          mt: 1,
          borderRadius: 1,
          border: '1px solid currentColor',
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          width: '88%',
          height: 12,
          borderRadius: 1,
          border: '1px solid currentColor',
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          width: '88%',
          height: 12,
          borderRadius: 1,
          background: item.effects.buttonGradient || item.colors.primary,
        }}
      />
    </Box>
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          height: 24,
          mx: 0.8,
          mt: 0.8,
          borderRadius: 1,
          bgcolor: item.colors.paper || (item.mode === 'dark' ? '#1f2937' : '#ffffff'),
          boxShadow: item.effects.shadow,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: '34px 0 0',
          opacity: 0.34,
          backgroundImage:
            'linear-gradient(28deg, transparent 46%, currentColor 47%, transparent 49%), linear-gradient(90deg, transparent 48%, currentColor 49%, transparent 51%)',
          backgroundSize: '42px 36px',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '45%',
          top: '54%',
          width: 22,
          height: 22,
          borderRadius: '50%',
          bgcolor: item.colors.primary,
          border: '3px solid rgba(255,255,255,0.9)',
          boxShadow: item.effects.glow,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          width: '48%',
          height: 38,
          p: 0.7,
          borderRadius: 1.5,
          bgcolor: item.colors.paper || (item.mode === 'dark' ? '#1f2937' : '#ffffff'),
          boxShadow: item.effects.shadow,
        }}
      >
        <Box
          sx={{ width: '72%', height: 4, borderRadius: 3, bgcolor: 'currentColor', opacity: 0.75 }}
        />
        <Box
          sx={{ width: '48%', height: 3, mt: 0.7, borderRadius: 3, bgcolor: item.colors.secondary }}
        />
        <Box
          sx={{
            width: '90%',
            height: 3,
            mt: 0.7,
            borderRadius: 3,
            bgcolor: 'currentColor',
            opacity: 0.22,
          }}
        />
      </Box>
    </Box>
  </Box>
);

const SystemThemeSelector = ({ value, previewActive, onChange, onRestore }) => (
  <Stack spacing={2}>
    <Box>
      <Typography variant="body2" color="text.secondary">
        Selecione um modelo para visualizar a prévia em todo o sistema. A alteração só será gravada
        ao clicar em Salvar.
      </Typography>
      {previewActive && (
        <Chip
          size="small"
          color="primary"
          icon={<CheckCircleIcon />}
          label="Prévia ativa"
          sx={{ mt: 1.5 }}
        />
      )}
    </Box>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 1.5,
      }}
    >
      {SYSTEM_THEMES.map((item) => {
        const selected = value === item.id;
        return (
          <Paper
            key={item.id}
            variant="outlined"
            sx={(theme) => ({
              p: 1.5,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
              boxShadow: selected ? theme.systemTheme.effects.glow : 'none',
            })}
          >
            <ThemePreview item={item} />
            <Stack spacing={0.5} sx={{ mt: 1.25, minHeight: 84 }}>
              <Typography variant="subtitle2">{item.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.description}
              </Typography>
            </Stack>
            <Button
              fullWidth
              size="small"
              variant={selected ? 'contained' : 'outlined'}
              startIcon={selected ? <CheckCircleIcon /> : null}
              onClick={() => onChange(item.id)}
            >
              {selected ? 'Selecionado' : 'Selecionar'}
            </Button>
          </Paper>
        );
      })}
    </Box>
    <Button variant="text" color="inherit" startIcon={<RestartAltIcon />} onClick={onRestore}>
      Restaurar tema padrão
    </Button>
  </Stack>
);

export default SystemThemeSelector;
