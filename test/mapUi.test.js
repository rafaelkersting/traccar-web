import assert from 'node:assert/strict';
import test from 'node:test';
import { devicesActions, devicesReducer } from '../src/store/devices.js';
import { mapUiActions, mapUiReducer, statusCardModes } from '../src/store/mapUi.js';

const followState = () => {
  let state = mapUiReducer(undefined, { type: 'init' });
  state = mapUiReducer(
    state,
    mapUiActions.updateFollow({ available: true, paused: false, mode: 'heading' }),
  );
  return state;
};

test('minimizing details preserves active Follow and Heading Up', () => {
  const state = mapUiReducer(followState(), mapUiActions.setDetailsMode(statusCardModes.collapsed));

  assert.equal(state.detailsMode, statusCardModes.collapsed);
  assert.equal(state.followAvailable, true);
  assert.equal(state.followPaused, false);
  assert.equal(state.followMode, 'heading');
});

test('closing details preserves active Follow and Heading Up', () => {
  const state = mapUiReducer(followState(), mapUiActions.setDetailsMode(statusCardModes.closed));

  assert.equal(state.detailsMode, statusCardModes.closed);
  assert.equal(state.followAvailable, true);
  assert.equal(state.followPaused, false);
  assert.equal(state.followMode, 'heading');
});

test('reopening details changes only the card presentation', () => {
  let state = mapUiReducer(followState(), mapUiActions.setDetailsMode(statusCardModes.closed));
  state = mapUiReducer(state, mapUiActions.setDetailsMode(statusCardModes.expanded));

  assert.equal(state.detailsMode, statusCardModes.expanded);
  assert.equal(state.followAvailable, true);
  assert.equal(state.followPaused, false);
  assert.equal(state.followMode, 'heading');
});

test('card presentation actions do not clear the selected device', () => {
  let devices = devicesReducer(undefined, { type: 'init' });
  devices = devicesReducer(devices, devicesActions.selectId(7));

  devices = devicesReducer(devices, mapUiActions.setDetailsMode(statusCardModes.closed));
  assert.equal(devices.selectedId, 7);

  devices = devicesReducer(devices, mapUiActions.setDetailsMode(statusCardModes.collapsed));
  assert.equal(devices.selectedId, 7);
});

test('invalid card presentation is ignored', () => {
  const initial = mapUiReducer(undefined, { type: 'init' });
  const state = mapUiReducer(initial, mapUiActions.setDetailsMode('invalid'));

  assert.equal(state.detailsMode, statusCardModes.closed);
});
