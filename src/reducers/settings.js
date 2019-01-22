// @flow

const initialState: Settings = {
  id: null,
  loading: true,
  registerEnabled: false,
  screenSharingEnabled: false,
  siteColor: null,
  siteLogo: null,
  siteFavicon: null,
  otApiKey: null,
  otSecret: null,
};

const settings = (state: Settings = initialState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'SET_SITE_SETTINGS':
      return { ...action.settings, loading: false };
    case 'SITE_SETTINGS_ERR':
      return { ...state, loading: false };
    default:
      return state;
  }
};

export default settings;
