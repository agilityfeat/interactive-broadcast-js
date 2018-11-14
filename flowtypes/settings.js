declare type Settings = {
  siteColor: string,
  registerEnabled?: boolean
};

declare type SettingsAction =
    { type: 'LISTEN_SITE_SETTINGS' } |
    { type: 'SET_SITE_SETTINGS', settings: SiteSettings };

declare type SettingsState = Settings | null;
