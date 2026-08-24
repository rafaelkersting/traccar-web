import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';
import usePersistedState from '../../common/util/usePersistedState';
import { toMapCoordinates } from '../core/mapUtil';
import { isPositionMoving } from '../core/deviceMarkerMotion';
import {
  isValidFollowPosition,
  normalizeVehicleFollowMode,
  resolveFollowBearing,
  resolveFollowDuration,
  resolveFollowHeading,
  resolveFollowOffset,
  vehicleFollowModes,
} from '../core/vehicleFollow';
import MapVehicleFollowControl from '../control/MapVehicleFollowControl';
import { mapUiActions } from '../../store';

const positionKey = (position) =>
  position
    ? `${position.id}:${position.fixTime}:${position.longitude}:${position.latitude}:${position.course}`
    : null;

const MapSelectedDevice = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const selectedTime = useSelector((state) => state.devices.selectTime);
  const selectedId = useSelector((state) => state.devices.selectedId);
  const position = useSelector((state) => state.session.positions[selectedId]);
  const deviceStatus = useSelector((state) => state.devices.items[selectedId]?.status);
  const selectZoom = useAttributePreference('web.selectZoom', 10);
  const autoFollow = useAttributePreference('mapFollow', true);
  const [storedMode, setStoredMode] = usePersistedState(
    'vehicleFollowMode',
    vehicleFollowModes.north,
  );
  const mode = normalizeVehicleFollowMode(storedMode);
  const [paused, setPaused] = useState(false);
  const followAvailable = Boolean(selectedId && position);

  const selectedIdRef = useRef();
  const selectedTimeRef = useRef();
  const previousPositionRef = useRef();
  const positionKeyRef = useRef();
  const headingRef = useRef();
  const modeRef = useRef(mode);

  useEffect(() => {
    if (mode !== storedMode) {
      setStoredMode(mode);
    }
  }, [mode, setStoredMode, storedMode]);

  useEffect(() => {
    dispatch(
      mapUiActions.updateFollow({
        available: followAvailable,
        paused,
        mode,
      }),
    );
  }, [dispatch, followAvailable, mode, paused]);

  const moveCamera = useCallback(
    (currentPosition, previousPosition, initial = false) => {
      if (!isValidFollowPosition(currentPosition)) return;
      headingRef.current = resolveFollowHeading(headingRef.current, currentPosition);
      const bearing = resolveFollowBearing(mode, map.getBearing(), headingRef.current);
      const canvas = map.getCanvas();
      const options = {
        center: toMapCoordinates(currentPosition.longitude, currentPosition.latitude),
        duration: reducedMotion
          ? 0
          : initial
            ? 650
            : resolveFollowDuration(previousPosition, currentPosition),
        easing: (progress) => progress * progress * (3 - 2 * progress),
        offset: resolveFollowOffset(mode, canvas.clientHeight, desktop),
        essential: true,
      };
      if (initial) {
        options.zoom = Math.max(map.getZoom(), selectZoom);
      }
      if (bearing !== null) {
        options.bearing = bearing;
      }
      map.easeTo(options);
    },
    [desktop, mode, reducedMotion, selectZoom],
  );

  useEffect(() => {
    const selectionChanged =
      selectedId !== selectedIdRef.current || selectedTime !== selectedTimeRef.current;
    if (!selectionChanged) return;
    selectedIdRef.current = selectedId;
    selectedTimeRef.current = selectedTime;
    previousPositionRef.current = position;
    positionKeyRef.current = positionKey(position);
    headingRef.current = resolveFollowHeading(null, position);
    setPaused(!autoFollow);
    if (selectedId && position) {
      moveCamera(position, null, true);
    }
  }, [autoFollow, moveCamera, position, selectedId, selectedTime]);

  useEffect(() => {
    if (!selectedId || !position) return;
    const nextKey = positionKey(position);
    if (nextKey === positionKeyRef.current) return;
    const previousPosition = previousPositionRef.current;
    previousPositionRef.current = position;
    positionKeyRef.current = nextKey;
    headingRef.current = resolveFollowHeading(headingRef.current, position);
    if (paused || deviceStatus !== 'online') return;
    if (previousPosition && !isPositionMoving(position)) return;
    moveCamera(position, previousPosition, !previousPosition);
  }, [deviceStatus, moveCamera, paused, position, selectedId]);

  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    if (!selectedId || paused || !position) return;
    moveCamera(position, previousPositionRef.current, false);
  }, [mode, moveCamera, paused, position, selectedId]);

  useEffect(() => {
    const pauseForInteraction = (event) => {
      if (event.originalEvent && selectedIdRef.current) {
        setPaused(true);
      }
    };
    map.on('dragstart', pauseForInteraction);
    map.on('rotatestart', pauseForInteraction);
    return () => {
      map.off('dragstart', pauseForInteraction);
      map.off('rotatestart', pauseForInteraction);
    };
  }, []);

  const toggleFollow = useCallback(() => {
    if (!selectedId || !position) return;
    if (paused) {
      setPaused(false);
      moveCamera(position, previousPositionRef.current, false);
    } else {
      map.stop();
      setPaused(true);
    }
  }, [moveCamera, paused, position, selectedId]);

  const toggleMode = useCallback(() => {
    setStoredMode(
      mode === vehicleFollowModes.heading ? vehicleFollowModes.north : vehicleFollowModes.heading,
    );
  }, [mode, setStoredMode]);

  return createElement(MapVehicleFollowControl, {
    selected: Boolean(selectedId && position),
    paused,
    mode,
    onToggleFollow: toggleFollow,
    onToggleMode: toggleMode,
  });
};

export default MapSelectedDevice;
