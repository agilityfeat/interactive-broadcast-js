// @flow

const initialState: Settings = {
  requireRegister: null,
  siteColor: null,
};

const settings = (state: Settings = initialState, action: UserAction): SettingsState => {
  switch (action.type) {
    case 'SET_SITE_SETTINGS':
      return action.settings;
    default:
      return state;
  }
};

export default settings;
