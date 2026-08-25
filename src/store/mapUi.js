import { createSlice } from '@reduxjs/toolkit';
import { defaultVehicleFollowMode } from '../map/core/vehicleFollow.js';

export const statusCardModes = Object.freeze({
  expanded: 'expanded',
  collapsed: 'collapsed',
  closed: 'closed',
});

const validStatusCardModes = new Set(Object.values(statusCardModes));

const { reducer, actions } = createSlice({
  name: 'mapUi',
  initialState: {
    detailsMode: statusCardModes.closed,
    followAvailable: false,
    followPaused: true,
    followMode: defaultVehicleFollowMode,
  },
  reducers: {
    setDetailsMode(state, action) {
      if (validStatusCardModes.has(action.payload)) {
        state.detailsMode = action.payload;
      }
    },
    updateFollow(state, action) {
      state.followAvailable = Boolean(action.payload.available);
      state.followPaused = Boolean(action.payload.paused);
      state.followMode = action.payload.mode;
    },
  },
});

export { actions as mapUiActions };
export { reducer as mapUiReducer };
