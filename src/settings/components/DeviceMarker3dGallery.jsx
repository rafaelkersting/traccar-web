import { Box, ButtonBase, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { marker3dCatalog } from '../../map/core/marker3dCatalog';

const DeviceMarker3dGallery = ({ value, onChange, disabled }) => (
  <Box
    role="radiogroup"
    aria-label="Galeria de ícones 3D para o mapa"
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
      gap: 1,
      width: '100%',
    }}
  >
    {marker3dCatalog.map((marker) => {
      const selected = value === marker.id;
      return (
        <ButtonBase
          key={marker.id}
          role="radio"
          aria-checked={selected}
          aria-label={`Selecionar ícone 3D: ${marker.name}`}
          disabled={disabled}
          onClick={() => onChange(marker.id)}
          sx={(theme) => ({
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            minHeight: 116,
            p: 1,
            border: '2px solid',
            borderColor: selected ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: selected ? 'action.selected' : 'background.paper',
            transition: theme.transitions.create(['border-color', 'background-color', 'transform']),
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              transform: 'translateY(-1px)',
            },
            '&:focus-visible': {
              outline: `3px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          })}
        >
          {selected && (
            <CheckCircleIcon
              color="primary"
              fontSize="small"
              sx={{ position: 'absolute', top: 5, right: 5 }}
            />
          )}
          <Box
            component="img"
            src={marker.image}
            alt=""
            sx={{ width: 72, height: 72, objectFit: 'contain', pointerEvents: 'none' }}
          />
          <Typography variant="caption" align="center" sx={{ lineHeight: 1.15 }}>
            {marker.name}
          </Typography>
        </ButtonBase>
      );
    })}
  </Box>
);

export default DeviceMarker3dGallery;
