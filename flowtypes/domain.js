// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type Domain = {
  id: string,
  hls: boolean,
  httpSupport: boolean,
  audioOnlyEnabled: boolean,
  embedEnabled: boolean,
  registrationEnabled: boolean,
  fileSharingEnabled: boolean,
  siteColor: string,
  domain: string
 };

declare type DomainMap = {[id: string]: Domain};

declare type ManageDomainsAction =
  { type: 'SET_DOMAINS', domains: DomainMap } |
  { type: 'UPDATE_DOMAIN', domain: Domain } |
  { type: 'REMOVE_DOMAIN', domainId: string };


declare type DomainFormData = {
  id: DomainId,
  hls: boolean,
  httpSupport: boolean,
  audioOnlyEnabled: boolean,
  embedEnabled: boolean,
  registrationEnabled: boolean,
  fileSharingEnabled: boolean,
  siteColor: string,
  domain: string,
  otApiKey: string,
  otSecret: string
};
