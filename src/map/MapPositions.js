import { useId, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts, fromMapCoordinates, toMapCoordinates } from './core/mapUtil';
import useDeviceMarkerImages from './core/useDeviceMarkerImages';
import { resolveDeviceMarkerImage } from './core/deviceMarker';
import {
  createMarkerTransition,
  isRotatableVehicleMarker,
  resolveMarkerMotionState,
  sampleMarkerTransition,
} from './core/deviceMarkerMotion';

const MapPositions = ({
  positions,
  onMapClick,
  onMarkerClick,
  showStatus,
  selectedPosition,
  titleField,
  disabled,
  animate = false,
}) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  const animationEnabled = animate && !reducedMotion;

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const markerImages = useDeviceMarkerImages(id, devices);

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const markerMotionRef = useRef(new Map());
  const previousPositionsRef = useRef(new Map());
  const animationFrameRef = useRef();
  const lastAnimationFrameRef = useRef(0);

  const createFeature = useCallback(
    (devices, position, selectedPositionId, selectedMarker, markerMotion) => {
      const device = devices[position.deviceId];
      const category = mapIconKey(device.category);
      const color = showStatus
        ? position.attributes.color || getStatusColor(device.status)
        : 'neutral';
      let showDirection;
      switch (directionType) {
        case 'none':
          showDirection = false;
          break;
        case 'all':
          showDirection = position.course > 0;
          break;
        default:
          showDirection = selectedPositionId === position.id && position.course > 0;
          break;
      }
      const customMarker = Boolean(markerImages[position.deviceId]);
      const rotatable = isRotatableVehicleMarker(device.category, customMarker);
      return {
        id: position.id,
        deviceId: position.deviceId,
        name: device.name,
        fixTime: formatTime(position.fixTime, 'seconds'),
        image: resolveDeviceMarkerImage(
          position.deviceId,
          `${category}-${color}`,
          markerImages,
          selectedMarker,
        ),
        customMarker,
        rotatable,
        rotation: markerMotion.course,
        direction: showDirection && !rotatable,
        markerState: markerMotion.markerState,
      };
    },
    [directionType, markerImages, showStatus],
  );

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const onMapClickCallback = useCallback(
    (event) => {
      if (!event.defaultPrevented && onMapClick) {
        const [longitude, latitude] = fromMapCoordinates(event.lngLat.lng, event.lngLat.lat);
        onMapClick(latitude, longitude);
      }
    },
    [onMapClick],
  );

  const onMarkerClickCallback = useCallback(
    (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const feature = event.features[0];
      if (onMarkerClick) {
        onMarkerClick(feature.properties.id, feature.properties.deviceId);
      }
    },
    [onMarkerClick],
  );

  const onClusterClick = useCatchCallback(
    async (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, {
        layers: [clusters],
      });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    },
    [clusters, id],
  );

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      map.addLayer({
        id: `state-${source}`,
        type: 'circle',
        source,
        filter: ['!has', 'point_count'],
        paint: {
          'circle-radius': source === selected ? 27 : 23,
          'circle-color': 'rgba(255, 255, 255, 0.08)',
          'circle-stroke-color': [
            'match',
            ['get', 'markerState'],
            'moving',
            '#2e7d32',
            'stopped',
            '#f9a825',
            '#757575',
          ],
          'circle-stroke-width': source === selected ? 3.5 : 2,
          'circle-opacity': ['case', ['==', ['get', 'markerState'], 'offline'], 0.65, 0.95],
          'circle-blur': 0.05,
        },
      });
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{image}',
          'icon-size': ['case', ['get', 'customMarker'], 1, iconScale],
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-rotate': ['case', ['get', 'rotatable'], ['get', 'rotation'], 0],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'text-field': `{${titleField || 'name'}}`,
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2.2],
          'text-font': findFonts(map),
          'text-size': 12,
          'symbol-sort-key': ['get', 'id'],
        },
        paint: {
          'icon-opacity': ['case', ['==', ['get', 'markerState'], 'offline'], 0.55, 1],
          'text-color': theme.palette.text.primary,
          'text-halo-color': theme.palette.background.paper,
          'text-halo-width': 1,
        },
      });
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClickCallback);
    });
    map.addLayer({
      id: `${clusters}-background`,
      type: 'circle',
      source: id,
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': 18 * iconScale,
        'circle-color': theme.palette.primary.main,
        'circle-stroke-color': theme.palette.background.paper,
        'circle-stroke-width': 3,
        'circle-blur': 0.05,
      },
    });
    map.addLayer({
      id: clusters,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
      paint: {
        'text-color': theme.palette.primary.contrastText,
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClickCallback);

    return () => {
      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClickCallback);

      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }
      if (map.getLayer(`${clusters}-background`)) {
        map.removeLayer(`${clusters}-background`);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClickCallback);

        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        if (map.getLayer(`state-${source}`)) {
          map.removeLayer(`state-${source}`);
        }
        if (map.getLayer(`direction-${source}`)) {
          map.removeLayer(`direction-${source}`);
        }
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [
    mapCluster,
    clusters,
    onMarkerClickCallback,
    onClusterClick,
    onMapClickCallback,
    iconScale,
    id,
    selected,
    titleField,
    theme.palette.background.paper,
    theme.palette.primary.contrastText,
    theme.palette.primary.main,
    theme.palette.text.primary,
  ]);

  useEffect(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    const timestamp = performance.now();
    const availablePositions = positions.filter((position) =>
      devices.hasOwnProperty(position.deviceId),
    );
    const activeDeviceIds = new Set(availablePositions.map((position) => position.deviceId));

    availablePositions.forEach((position) => {
      const device = devices[position.deviceId];
      const previous = markerMotionRef.current.get(position.deviceId);
      const key = `${position.id}:${position.longitude}:${position.latitude}:${position.course}:${position.speed}`;
      if (!previous || previous.key !== key) {
        markerMotionRef.current.set(
          position.deviceId,
          createMarkerTransition({
            previous,
            previousPosition: previousPositionsRef.current.get(position.deviceId),
            position,
            deviceStatus: device.status,
            timestamp,
            animate: animationEnabled,
          }),
        );
      } else {
        previous.markerState = resolveMarkerMotionState(device.status, position);
      }
    });
    markerMotionRef.current.forEach((_, deviceId) => {
      if (!activeDeviceIds.has(deviceId)) {
        markerMotionRef.current.delete(deviceId);
      }
    });
    previousPositionsRef.current = new Map(
      availablePositions.map((position) => [position.deviceId, position]),
    );

    let active = true;
    const publishFrame = (frameTimestamp, force = false) => {
      if (!active) return;
      if (!force && frameTimestamp - lastAnimationFrameRef.current < 32) {
        animationFrameRef.current = window.requestAnimationFrame(publishFrame);
        return;
      }
      lastAnimationFrameRef.current = frameTimestamp;
      let animationPending = false;
      const sampledPositions = availablePositions.map((position) => {
        const transition = markerMotionRef.current.get(position.deviceId);
        const sample = sampleMarkerTransition(transition, frameTimestamp);
        animationPending ||= !sample.complete;
        return { position, sample };
      });

      [id, selected].forEach((source) => {
        map.getSource(source)?.setData({
          type: 'FeatureCollection',
          features: sampledPositions
            .filter(({ position }) =>
              source === id
                ? position.deviceId !== selectedDeviceId
                : position.deviceId === selectedDeviceId,
            )
            .map(({ position, sample }) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: toMapCoordinates(sample.longitude, sample.latitude),
              },
              properties: createFeature(
                devices,
                position,
                selectedPosition && selectedPosition.id,
                source === selected,
                {
                  course: sample.course,
                  markerState: markerMotionRef.current.get(position.deviceId).markerState,
                },
              ),
            })),
        });
      });

      if (animationPending) {
        animationFrameRef.current = window.requestAnimationFrame(publishFrame);
      }
    };

    publishFrame(timestamp, true);
    return () => {
      active = false;
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    animationEnabled,
    devices,
    positions,
    selectedPosition,
    createFeature,
    id,
    selected,
    selectedDeviceId,
  ]);

  return null;
};

export default MapPositions;
