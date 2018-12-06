// @flow
import R from 'ramda';
import { loadAuthToken as jwt } from './localStorage';
import api from '../config/api';

/** Constants */
const origin = window.location.origin;
const url = R.contains('localhost', origin) ? api.localhost : api.production;
const apiUrl = `${url}/api`;
const defaultHeaders = {
  'Content-Type': 'application/json',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};
/** ********* */

/** Generator headers for a request */
const headers = (requiresAuth: boolean, authToken?: string): Headers =>
  R.merge(defaultHeaders, requiresAuth ? { Authorization: `Bearer ${authToken || jwt()}` } : null);

/** Check for external route containing http/https */
const getURL = (route: string): string => route.includes('http') ? route : `${apiUrl}/${route}`;

/** Parse a response based on the type */
const parseResponse = (response: Response): Promise<*> => {
  const contentType = R.head(R.split(';')(R.defaultTo('')(response.headers.get('content-type'))));
  if (contentType === 'application/json') {
    return response.json();
  }
  return response.text();  // contentType === 'text/html'
};

/** Parse API error response */
const parseErrorResponse = (response: Response): Promise<Error> => response.json();

/** Check for API-level errors */
const checkStatus = (response: Response): Promise<*> =>
  new Promise((resolve: Promise.resolve<Response>, reject: Promise.reject<Error>) => {
    if (response.status >= 200 && response.status < 300) { // $FlowFixMe
      resolve(response);
    } else {
      parseErrorResponse(response) // $FlowFixMe
        .then(({ message }: { message: string }): void => reject(new Error(message))) // $FlowFixMe
        .catch(reject);
    }
  });

/** Create a new Request object */
const request = (method: HttpMethod, route: string, data?: *, requiresAuth: boolean = true, authToken?: string): Request => {
  const body = (): {} | { body: string } => data ? { body: JSON.stringify(data) } : {};
  const baseOptions = {
    method: method.toUpperCase(),
    mode: 'cors',
    headers: new Headers(headers(requiresAuth, authToken)),
  };
  const requestOptions = R.merge(baseOptions, body());
  return new Request(getURL(route), requestOptions);
};

/** Execute a request using fetch */
const execute = (method: HttpMethod, route: string, body: * = null, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  new Promise((resolve: Promise.resolve<>, reject: Promise.reject<>) => {
    fetch(request(method, route, body, requiresAuth, authToken))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

/** HTTP Methods */
const get = (route: string, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  execute('get', route, null, requiresAuth, authToken);
const post = (route: string, body: * = null, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  execute('post', route, body, requiresAuth, authToken);
const put = (route: string, body: * = null, requiresAuth: boolean = true): Promise<*> => execute('put', route, body, requiresAuth);
const patch = (route: string, body: * = null, requiresAuth: boolean = true): Promise<*> => execute('patch', route, body, requiresAuth);
const del = (route: string, requiresAuth: boolean = true): Promise<*> => execute('delete', route, null, requiresAuth);

/** Exports */

/** Auth */
const getAuthTokenUser = (domainId: string, userType: string, userUrl: string, idToken?: string): Promise<{token: AuthToken}> =>
  post(`auth/token-${userType}`, R.assoc(`${userType}Url`, userUrl, { domainId, idToken }), false);
const getAuthToken = (idToken: string): Promise<{ token: AuthToken }> => post('auth/token', { idToken }, false);
const getAuthTokenViewer = (domainId: string, email: string, password: string, fanUrl: string): Promise<{token: AuthToken}> =>
  post('auth/token-fan', { domainId, email, password, fanUrl });

/** User */
const getUser = (userId: string): Promise<User> => get(`admin/${userId}`);
const createUser = (userData: UserFormData): Promise<User> => post('admin', userData);
const updateUser = (userData: UserUpdateFormData): Promise<User> => patch(`admin/${userData.id}`, userData);
const getAllUsers = (): Promise<[User]> => get('admin');
const deleteUserRecord = (userId: string): Promise<boolean> => del(`admin/${userId}`);

/** Viewer */
const getViewer = (domainId: string, userId: string, authToken?: string): Promise<User> => get(`viewer/${domainId}/${userId}`, true, authToken);
const createViewer = (viewerData: ViewerFormData): Promise<*> => post('viewer', viewerData, false);

/** Events */
const getEventsByDomain = (domainId: string): Promise<BroadcastEventMap> => get(`event/get-by-domain?domainId=${domainId}`);
const getEvents = (): Promise<BroadcastEventMap> => get('event');
const getEvent = (id: string): Promise<BroadcastEvent> => get(`event/${id}`);
const getEventByKey = (domainId: string, slug: string): Promise<BroadcastEvent> => get(`event/get-by-key?domainId=${domainId}&slug=${slug}`);
const createEvent = (data: BroadcastEventFormData): Promise<BroadcastEvent> => post('event', data);
const updateEvent = (data: BroadcastEventUpdateFormData): Promise<BroadcastEvent> => patch(`event/${data.id}`, data);
const updateEventStatus = (id: string, status: EventStatus): Promise<BroadcastEvent> => put(`event/change-status/${id}`, { status });
const deleteEvent = (id: string): Promise<boolean> => del(`event/${id}`);
const getMostRecentEvent = (id: string): Promise<BroadcastEvent> => get(`event/get-current-admin-event?domainId=${id}`);
const getAdminCredentials = (eventId: EventId): Promise<UserCredentials> => post(`event/create-token-producer/${eventId}`);
const getEventWithCredentials = (data: { domainId: string, userType: UserRole }, authToken: AuthToken): Promise<HostCelebEventData> =>
  post(`event/create-token-${data.userType}`, data, true, authToken);
const getEmbedEventWithCredentials = (data: { domainId: string, userType: UserRole }, authToken: AuthToken): Promise<HostCelebEventData> =>
  post(`event/create-token/${data.domainId}/${data.userType}`, data, true, authToken);

/** Domains */
const getAllDomains = (): Promise<[Domain]> => get('domain');
const getDomain = (id: string): Promise<Domain> => get(`domain/${id}`);
const createDomain = (data: DomainFormData): Promise<Domain> => post('domain', data);
const updateDomain = (data: DomainFormData): Promise<Domain> => patch(`domain/${data.id}`, data);
const deleteDomain = (id: string): Promise<*> => del(`domain/${id}`);

/** Exports */
module.exports = {
  createDomain,
  createEvent,
  createUser,
  createViewer,
  deleteDomain,
  deleteEvent,
  deleteUserRecord,
  getAdminCredentials,
  getAllDomains,
  getAllUsers,
  getAuthToken,
  getAuthTokenUser,
  getAuthTokenViewer,
  getDomain,
  getEmbedEventWithCredentials,
  getEvent,
  getEventByKey,
  getEvents,
  getEventsByDomain,
  getEventWithCredentials,
  getMostRecentEvent,
  getUser,
  getViewer,
  updateDomain,
  updateEvent,
  updateEventStatus,
  updateUser,
  url,
};
