// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare class Headers {
    iterator(): Iterator<[string, string]>,
    constructor(init?: HeadersInit): void,
    append(name: string, value: string): void,
    delete(name: string): void,
    entries(): Iterator<[string, string]>,
    get(name: string): string,
    getAll(name: string): Array<string>,
    has(name: string): boolean,
    keys(): Iterator<string>,
    set(name: string, value: string): void,
    values(): Iterator<string>
}

type HeadersInit = Headers | {[key: string]: string};
declare type HttpMethod = 'get' | 'GET' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'delete' | 'DELETE';

// Redux state(s)
declare type State = {
  currentUser: CurrentUserState,
  users: UserMap,
  events: BroadcastEventMap,
  auth: AuthState,
  fan: FanState,
  broadcast: BroadcastState,
  settings: Settings
};

// What persists in local storage
declare type LocalStorageState = {
  currentUser?: CurrentUserState
};

// Redux Actions
declare type Action =
  AuthAction |
  UserAction |
  ManageUsersAction |
  EventsAction |
  BroadcastAction |
  FanAction |
  AlertAction;

// Redux dispatch, action creators, etc.
declare type ActionCreator = (*) => Action;
declare type Dispatch = (action: Action | Thunk | Array<Action>) => any; // eslint-disable-line flowtype/no-weak-types
declare type GetState = () => State;
declare type Thunk = (dispatch: Dispatch, getState: GetState) => any; // eslint-disable-line flowtype/no-weak-types
declare type ThunkActionCreator = (...*) => Thunk;

// React Component
declare type ReactComponent = React$Element<*> | null;

declare type Route = {
  props: {
    component?: ReactComponent,
    render?: (router: Object) => React$Element<*>, // eslint-disable-line flowtype/no-weak-types
    children?: (router: Object) => React$Element<*>, // eslint-disable-line flowtype/no-weak-types
    path?: string,
    exact?: boolean,
    strict?: boolean
  }
}


// Functions
declare type Unit = () => void;
declare type AsyncVoid = Promise<void>;
declare type UnitPromise = () => AsyncVoid;

// Forms
declare type FormErrors = null | { fields: { [field: string]: string, message: string } };

/**
 * Boilerplate React & Redux Types
 */

// http://www.saltycrane.com/blog/2016/06/flow-type-cheat-sheet/#lib/react.js
// React
declare class SyntheticEvent {
  bubbles: boolean,
  cancelable: boolean,
  currentTarget: EventTarget,
  defaultPrevented: boolean,
  eventPhase: number,
  isDefaultPrevented(): boolean,
  isPropagationStopped(): boolean,
  isTrusted: boolean,
  nativeEvent: Event,
  preventDefault(): void,
  stopPropagation(): void,
  target: EventTarget,
  timeStamp: number,
  type: string,
  persist(): void
}

// Redux
declare type Reducer<S, A> = (state: S, action: A) => S;
declare type Store<S, Action> = {
  dispatch: Dispatch,
  getState(): S,
  subscribe(listener: () => void): () => void,
  replaceReducer(nextReducer: Reducer<S, Action>): void
};

// https://github.com/flowtype/flow-typed/blob/master/definitions/npm/react-redux_v5.x.x/flow_v0.30.x-/react-redux_v5.x.x.js
// It's probably easier to use in-line type definitions for these:
// eslint-disable-next-line flowtype/no-weak-types
declare type MapStateToProps<S, OP: Object, SP: Object> = (state: S, ownProps: OP) => SP | MapStateToProps<S, OP, SP>;
// eslint-disable-next-line flowtype/no-weak-types
declare type MapDispatchToProps<DP: Object> = ((dispatch: Dispatch) => DP) | DP;  // Modified to use single type
declare type MapDispatchWithOwn<DP: Object, OP: Object> = ((dispatch: Dispatch, ownProps: OP) => DP); // eslint-disable-line flowtype/no-weak-types

