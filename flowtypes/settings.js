declare type Settings = {
  loading: boolean,
  siteColor: string,
  registerEnabled?: boolean,
  siteLogo: {
    id: string | null,
    url: string | null
  } | null,
  siteFavicon: {
    id: string | null,
    url: string | null
  } | null
};

declare type SettingsAction =
    { type: 'LISTEN_SITE_SETTINGS' } |
    { type: 'SET_SITE_SETTINGS', settings: SiteSettings } |
    { type: 'SITE_SETTINGS_ERR' };

declare type SettingsState = Settings | null;
