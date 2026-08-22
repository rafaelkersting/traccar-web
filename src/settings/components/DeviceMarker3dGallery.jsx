import { useEffect, useState } from 'react';
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  createMarker3dSelection,
  defaultMarker3dColorId,
  getMarker3dModels,
  marker3dCategories,
  marker3dColors,
} from '../../map/core/marker3dCatalog';
import { createMarker3dPreview } from '../../map/core/marker3dImage';

const optionStyle = (selected) => (theme) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 0.5,
  minHeight: 88,
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
});

const DeviceMarker3dGallery = ({ value, onChange, disabled }) => {
  const [preview, setPreview] = useState(null);
  const models = getMarker3dModels(value?.categoryId);

  useEffect(() => {
    let active = true;
    if (!value?.image) {
      setPreview(null);
      return undefined;
    }
    createMarker3dPreview(value.image, value.colorValue)
      .then((result) => active && setPreview(result))
      .catch(() => active && setPreview(value.image));
    return () => {
      active = false;
    };
  }, [value?.image, value?.colorValue]);

  const selectCategory = (category) =>
    onChange(
      createMarker3dSelection(
        category.id,
        category.models[0].modelId,
        value?.colorId || defaultMarker3dColorId,
      ),
    );

  const selectModel = (model) =>
    onChange(
      createMarker3dSelection(
        value.categoryId,
        model.modelId,
        value.colorId || defaultMarker3dColorId,
      ),
    );

  const selectColor = (color) =>
    onChange(createMarker3dSelection(value.categoryId, value.modelId, color.id));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Tipo do veículo
        </Typography>
        <Box
          role="radiogroup"
          aria-label="Tipo do veículo para o marcador"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(94px, 1fr))',
            gap: 1,
          }}
        >
          {marker3dCategories.map((category) => {
            const selected = value?.categoryId === category.id;
            return (
              <ButtonBase
                key={category.id}
                role="radio"
                aria-checked={selected}
                aria-label={`Selecionar categoria: ${category.name}`}
                disabled={disabled}
                onClick={() => selectCategory(category)}
                sx={optionStyle(selected)}
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
                  src={category.image}
                  alt=""
                  sx={{ width: 50, height: 50, objectFit: 'contain', pointerEvents: 'none' }}
                />
                <Typography variant="caption" align="center" sx={{ lineHeight: 1.15 }}>
                  {category.name}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {value && (
        <>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Modelo
            </Typography>
            <Box
              role="radiogroup"
              aria-label={`Modelos de ${value.categoryName}`}
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
            >
              {models.map((model) => {
                const selected = value.modelId === model.modelId;
                return (
                  <ButtonBase
                    key={model.id}
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => selectModel(model)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      border: '1px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      borderRadius: 5,
                      color: selected ? 'primary.main' : 'text.primary',
                      bgcolor: selected ? 'action.selected' : 'background.paper',
                      '&:focus-visible': {
                        outline: '3px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Typography variant="body2">{model.name}</Typography>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Cor
            </Typography>
            <Box role="radiogroup" aria-label="Cor do marcador" sx={{ display: 'flex', gap: 1 }}>
              {marker3dColors.map((color) => {
                const selected = value.colorId === color.id;
                return (
                  <Tooltip key={color.id} title={color.name} arrow>
                    <ButtonBase
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Selecionar cor: ${color.name}`}
                      disabled={disabled}
                      onClick={() => selectColor(color)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        bgcolor: color.value,
                        border: '3px solid',
                        borderColor: selected ? 'primary.main' : color.border,
                        boxShadow: selected ? 2 : 0,
                        '&:focus-visible': {
                          outline: '3px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          <Box
            aria-label="Pré-visualização do marcador"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="subtitle2">Pré-visualização do marcador</Typography>
            <Box
              component="img"
              src={preview || value.image}
              alt={`${value.categoryName}, ${value.name}, cor ${value.colorName}`}
              sx={{ width: 112, height: 112, objectFit: 'contain' }}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              {`${value.categoryName} > ${value.name} > ${value.colorName}`}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeviceMarker3dGallery;
