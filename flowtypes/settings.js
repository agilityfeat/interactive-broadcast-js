// @flow

declare type Settings = {
  id?: string | null,
  loading: boolean,
  siteColor: string | null,
  registrationEnabled?: boolean,
  screenSharingEnabled?: boolean,
  fileSharingEnabled?: boolean,
  siteLogo: {
    id: string | null,
    url: string | null
  } | null,
  siteFavicon: {
    id: string | null,
    url: string | null
  } | null,
  otApiKey: string | null,
  otSecret: string | null
};

declare type SettingsAction =
    { type: 'LISTEN_SITE_SETTINGS' } |
    { type: 'SET_SITE_SETTINGS', settings: Settings } |
    { type: 'SITE_SETTINGS_ERR' };

declare type SettingsState = Settings | null;
