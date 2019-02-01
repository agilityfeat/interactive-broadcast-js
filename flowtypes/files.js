// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type SharedFile = {
  eventId: string,
  fromId: string | null,
  id: string,
  name: string,
  type: string,
  url: string,
  userId: string
};

declare type FilesState = {
  sharedByMe: { [id]: SharedFile } | null,
  sharedWithMe: { [id]: SharedFile } | null,
  sharedWithAll: { [id]: SharedFile } | null
};

declare type FileAction =
  { type: 'RECV_SHARED_FILE', file: SharedFile } |
  { type: 'SEND_SHARED_FILE', file: SharedFile } |
  { type: 'SET_SHARED_FILES', data: FilesState };
