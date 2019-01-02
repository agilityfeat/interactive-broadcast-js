// @flow
import Hashids from 'hashids';
import R from 'ramda';
import { remove as removeDiacritics } from 'diacritics';
import { getDomain } from './api';

// eslint-disable-next-line no-regex-spaces
const convertName = R.compose(R.replace(/ /g, '-'), R.toLower, R.replace(/  +/g, ' '), removeDiacritics, R.replace(/[^a-zA-Z0-9 ]/g, ''), R.trim);
const hashEventName = (name: string): string => R.isEmpty(name) ? '' : new Hashids(name).encode(1, 2, 3);

// We still need to return urls when no name is provided as it provides the base for the urls in the event form
export const createUrls = ({ name, domainId }: { name?: string, domainId: string}): EventUrls => {
  if (!domainId) { return {}; }
  const eventName = convertName(name);
  const eventNameHash = hashEventName(eventName);
  return {
    fanUrl: `${window.location.origin}/show/${domainId}/${eventName}`,
    fanAudioUrl: `${window.location.origin}/post-production/${domainId}/${eventName}`,
    hostUrl: `${window.location.origin}/show-host/${domainId}/${eventNameHash}`,
    celebrityUrl: `${window.location.origin}/show-guest/${domainId}/${eventNameHash}`,
  };
};

export const createRoutes = ({ name, domainId }: { name?: string, domainId: string}): EventUrls => {
  if (!domainId) { return {}; }
  const eventName = convertName(name);
  const eventNameHash = hashEventName(eventName);
  return {
    fanRoute: `/show/${domainId}/${eventName}`,
    fanAudioRoute: `/post-production/${domainId}/${eventName}`,
    hostRoute: `/show-host/${domainId}/${eventNameHash}`,
    celebrityRoute: `/show-guest/${domainId}/${eventNameHash}`,
  };
};

export const loadUrls = async ({ name, domainId }: { name?: string, domainId: string}): EventUrls => {
  if (!domainId) { return {}; }
  const domain = await getDomain(domainId);
  const eventName = convertName(name);
  const eventNameHash = hashEventName(eventName);
  if (!domain) { return {}; }
  return {
    fanUrl: `${domain.domain}/show/${domainId}/${eventName}`,
    fanAudioUrl: `${domain.domain}/post-production/${domainId}/${eventName}`,
    hostUrl: `${domain.domain}/show-host/${domainId}/${eventNameHash}`,
    celebrityUrl: `${domain.domain}/show-guest/${domainId}/${eventNameHash}`,
  };
};
