import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useGeofenceAttributes from '../common/attributes/useGeofenceAttributes';
import SettingsMenu from './components/SettingsMenu';
import SelectField from '../common/components/SelectField';
import { geofencesActions } from '../store';
import useSettingsStyles from './common/useSettingsStyles';
import GeofenceConnectionsAccordion from './components/GeofenceConnectionsAccordion';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { buildGeofencePermissionChanges, createGeofenceConnections } from './geofenceConnections';

const updatePermissions = async (method, permissions) => {
  if (permissions.length) {
    await fetchOrThrow('/api/permissions/bulk', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
  }
};

const defaultItem = { attributes: {} };

const GeofencePage = () => {
  const { classes } = useSettingsStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const geofenceAttributes = useGeofenceAttributes(t);

  const [item, setItem] = useState();
  const [connections, setConnections] = useState(null);
  const [connectionsVersion, setConnectionsVersion] = useState(0);

  const onItemSaved = (result) => {
    dispatch(geofencesActions.update([result]));
  };

  const validate = () => item && item.name;

  const onSave = async (currentItem) => {
    const response = await fetchOrThrow(
      currentItem.id ? `/api/geofences/${currentItem.id}` : '/api/geofences',
      {
        method: currentItem.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentItem),
      },
    );
    const savedItem = await response.json();
    if (!currentItem.id) {
      setItem(savedItem);
    }

    const changes = buildGeofencePermissionChanges(savedItem.id, connections);
    try {
      await updatePermissions('POST', changes.addDevices);
      await updatePermissions('DELETE', changes.removeDevices);
      await updatePermissions('POST', changes.addGroups);
      await updatePermissions('DELETE', changes.removeGroups);
      setConnections(
        createGeofenceConnections({
          deviceIds: connections.deviceIds,
          groupIds: connections.groupIds,
        }),
      );
    } catch (error) {
      setConnectionsVersion((version) => version + 1);
      throw error;
    }

    return savedItem;
  };

  return (
    <EditItemView
      endpoint="geofences"
      item={item}
      setItem={setItem}
      defaultItem={defaultItem}
      validate={validate}
      onItemSaved={onItemSaved}
      onSave={onSave}
      canSave={Boolean(connections)}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedGeofence']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
            </AccordionDetails>
          </Accordion>
          <GeofenceConnectionsAccordion
            key={connectionsVersion}
            geofenceId={item.id}
            connections={connections}
            setConnections={setConnections}
          />
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.description || ''}
                onChange={(event) => setItem({ ...item, description: event.target.value })}
                label={t('sharedDescription')}
              />
              <SelectField
                value={item.calendarId}
                onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                endpoint="/api/calendars"
                label={t('sharedCalendar')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(item.attributes?.hide)}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...item.attributes, hide: e.target.checked },
                      })
                    }
                  />
                }
                label={t('sharedFilterMap')}
              />
            </AccordionDetails>
          </Accordion>
          <EditAttributesAccordion
            attributes={item.attributes || {}}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={geofenceAttributes}
          />
        </>
      )}
    </EditItemView>
  );
};

export default GeofencePage;
