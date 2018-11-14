// @flow
const storageKey = 'interactiveBroadcast';

export const loadState = (): LocalStorageState | void => {
  try {
    const serializedState = localStorage.getItem(storageKey);
    if (!serializedState) {
      return undefined;
    }

    const state = JSON.parse(serializedState);
    if (state.settings.siteColor) {
      const { siteColor } = state.settings;
      const html = document.getElementsByTagName('html')[0];

      html.style.setProperty('--main-header-bg', siteColor);
      html.style.setProperty('--main-btn-bg', siteColor);
      html.style.setProperty('--link-color', siteColor);
    }

    return state;
  } catch (error) {
    return undefined;
  }
};

export const saveState = (state: LocalStorageState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(storageKey, serializedState);
  } catch (error) {
    // Nothing to do, nowhere to go
  }
};

export const saveAuthToken = (token: string): void => {
  try {
    localStorage.setItem(`${storageKey}-token`, token);
  } catch (error) {
    // Nothing to do, nowhere to go
  }
};


export const loadAuthToken = (): string => localStorage.getItem(`${storageKey}-token`) || '';
