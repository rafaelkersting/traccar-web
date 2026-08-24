const validTimestamp = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const getLivePositionTimestamp = (position) =>
  validTimestamp(position?.fixTime) ??
  validTimestamp(position?.deviceTime) ??
  validTimestamp(position?.serverTime);

export const shouldAcceptLivePosition = (current, incoming) => {
  if (!current) {
    return true;
  }
  const currentTimestamp = getLivePositionTimestamp(current);
  const incomingTimestamp = getLivePositionTimestamp(incoming);
  if (currentTimestamp !== null && incomingTimestamp !== null) {
    if (incomingTimestamp !== currentTimestamp) {
      return incomingTimestamp > currentTimestamp;
    }
    if (Number.isFinite(Number(current.id)) && Number.isFinite(Number(incoming?.id))) {
      return Number(incoming.id) >= Number(current.id);
    }
  }
  return true;
};
