export const getUserAccountCapabilities = ({ can, self, creating, manager, administrator }) => {
  const canEditOther = creating ? can('user.create') : can('user.edit');
  return {
    basic: self ? can('account.basic.edit') : canEditOther,
    email: self ? can('account.email.edit') : canEditOther,
    password: self ? can('account.password.change') : canEditOther,
    security: self ? can('account.security.edit') : canEditOther,
    preferences: self ? can('account.preferences.edit') : canEditOther,
    location: self ? can('account.location.edit') : canEditOther,
    attributes: self ? can('account.attributes.edit') : canEditOther && can('user.attributes.edit'),
    nativeRestrictions: !self && manager && can('user.native-restrictions.edit'),
    accessControl: !self && administrator && can('user.access-control.edit'),
    editOther: canEditOther,
  };
};
