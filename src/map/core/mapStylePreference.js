export const demoMapStyle = 'googleHybrid';

export const mapStyleStorageKey = (user) =>
  user?.attributes?.demo && user.id ? `selectedMapStyle.demo.${user.id}` : 'selectedMapStyle';

export const initialMapStyle = (user, preference) =>
  user?.attributes?.demo ? demoMapStyle : preference;
