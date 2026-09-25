import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAsyncTask } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import useSettingsStyles from '../common/useSettingsStyles';
import {
  createGeofenceConnections,
  hasGeofenceConnections,
  selectAllCurrentDeviceIds,
} from '../geofenceConnections';

const LINK_LOAD_CONCURRENCY = 6;

const loadLinkedIds = async (items, parameter, geofenceId, signal) => {
  if (!geofenceId || !items.length) {
    return [];
  }

  const linkedIds = [];
  let nextIndex = 0;
  const loadNext = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      const response = await fetchOrThrow(`/api/geofences?${parameter}=${item.id}`, { signal });
      const geofences = await response.json();
      if (geofences.some((geofence) => geofence.id === geofenceId)) {
        linkedIds.push(item.id);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(LINK_LOAD_CONCURRENCY, items.length) }, () => loadNext()),
  );
  return linkedIds;
};

const GeofenceConnectionsAccordion = ({ geofenceId, connections, setConnections }) => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const translate = (key, fallback) => t(key) || fallback;
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useAsyncTask(
    async ({ signal }) => {
      setLoading(true);
      setConnections(null);

      const [devicesResponse, groupsResponse] = await Promise.all([
        fetchOrThrow('/api/devices', { signal }),
        fetchOrThrow('/api/groups', { signal }),
      ]);
      const [availableDevices, availableGroups] = await Promise.all([
        devicesResponse.json(),
        groupsResponse.json(),
      ]);
      const [deviceIds, groupIds] = await Promise.all([
        loadLinkedIds(availableDevices, 'deviceId', geofenceId, signal),
        loadLinkedIds(availableGroups, 'groupId', geofenceId, signal),
      ]);

      if (!signal.aborted) {
        setDevices(availableDevices);
        setGroups(availableGroups);
        setConnections(createGeofenceConnections({ deviceIds, groupIds }));
        setLoading(false);
      }
    },
    [geofenceId, setConnections],
  );

  const selectedDevices = connections
    ? devices.filter((device) => connections.deviceIds.includes(device.id))
    : [];
  const selectedGroups = connections
    ? groups.filter((group) => connections.groupIds.includes(group.id))
    : [];
  const allCurrentDevicesSelected = devices.length > 0 && selectedDevices.length === devices.length;

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack>
          <Typography variant="subtitle1">
            {translate('geofenceConnectionsTitle', 'Apply this geofence to')}
          </Typography>
          {connections && (
            <Typography variant="caption" color="text.secondary">
              {translate('geofenceDirectDevicesLabel', 'Directly linked devices')}:{' '}
              {connections.deviceIds.length} · {translate('geofenceGroupsLabel', 'Linked groups')}:{' '}
              {connections.groupIds.length}
            </Typography>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails className={classes.details}>
        {loading || !connections ? (
          <Stack sx={{ alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <>
            {!hasGeofenceConnections(connections) && (
              <Alert severity="warning">
                {translate(
                  'geofenceNoConnectionsWarning',
                  'This geofence is not linked to any device or group. Enter and exit events will not be generated.',
                )}
              </Alert>
            )}

            <Typography variant="body2">
              {translate('geofenceDirectDevicesLabel', 'Directly linked devices')}:{' '}
              {connections.deviceIds.length}
            </Typography>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={devices}
              value={selectedDevices}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) =>
                setConnections({ ...connections, deviceIds: value.map((device) => device.id) })
              }
              renderOption={({ key, ...props }, option, { selected }) => (
                <li key={option.id || key} {...props}>
                  <Checkbox checked={selected} />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={translate('geofenceDirectDevicesLabel', 'Directly linked devices')}
                />
              )}
            />
            <Stack sx={{ alignItems: 'flex-start' }}>
              <Button
                variant="outlined"
                size="small"
                disabled={!devices.length || allCurrentDevicesSelected}
                onClick={() =>
                  setConnections({
                    ...connections,
                    deviceIds: selectAllCurrentDeviceIds(devices),
                  })
                }
              >
                {translate('geofenceSelectAllCurrentDevices', 'Select all current devices')}
              </Button>
              <FormHelperText>
                {translate(
                  'geofenceSelectAllCurrentDevicesHelper',
                  'Selects the devices available now. Devices created in the future will not be linked automatically.',
                )}
              </FormHelperText>
            </Stack>

            <Typography variant="body2">
              {translate('geofenceGroupsLabel', 'Linked groups')}: {connections.groupIds.length}
            </Typography>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={groups}
              value={selectedGroups}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) =>
                setConnections({ ...connections, groupIds: value.map((group) => group.id) })
              }
              renderOption={({ key, ...props }, option, { selected }) => (
                <li key={option.id || key} {...props}>
                  <Checkbox checked={selected} />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label={translate('geofenceGroupsLabel', 'Linked groups')} />
              )}
            />
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default GeofenceConnectionsAccordion;
