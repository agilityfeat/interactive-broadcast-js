// @flow
import R from 'ramda';
import { setInfo, resetAlert, setError, setWarning, setSuccess } from './alert';
import { getAllDomains, deleteDomain as destroy, updateDomain as update, createDomain } from '../services/api';


const setDomains: ActionCreator = (domains: DomainMap): ManageDomainsAction => ({
  type: 'SET_DOMAINS',
  domains,
});

const updateDomain: ActionCreator = (domain: Domain): ManageDomainsAction => ({
  type: 'UPDATE_DOMAIN',
  domain,
});

const removeDomain: ActionCreator = (domainId: DomainId): ManageDomainsAction => ({
  type: 'REMOVE_DOMAIN',
  domainId,
});

const uploadImage: ThunkActionCreator = (title: string): Thunk =>
  async (dispatch: Dispatch): null => {
    const options: AlertPartialOptions = {
      title,
      text: 'This may take a few seconds . . .',
      showConfirmButton: false,
    };

    dispatch(setInfo(options));
  };


const uploadImageCancel: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(resetAlert());
  };

const uploadImageSuccess: ThunkActionCreator = (title: string): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertPartialOptions = {
      title,
      text: 'Your image has been uploaded.',
      showConfirmButton: true,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setSuccess(options));
  };

const getDomains: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const domains = await getAllDomains();
      dispatch(setDomains(domains));
    } catch (error) {
      console.log(error);
    }
  };

const confirmDeleteDomain: ThunkActionCreator = (domainId: DomainId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await destroy(domainId);
      dispatch(removeDomain(domainId));
    } catch (error) {
      console.log(error);
    }
  };

const deleteDomain: ThunkActionCreator = (domainId: DomainId): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertPartialOptions = {
      title: 'Delete Domain',
      text: 'Are you sure you wish to delete this domain?  All events associated with the domain will also be deleted.',
      showCancelButton: true,
      onConfirm: (): void => R.forEach(dispatch, [resetAlert(), confirmDeleteDomain(domainId)]),
      onCancel: (): void => dispatch(resetAlert()),
    };
    dispatch(setWarning(options));
  };

const updateDomainRecord: ThunkActionCreator = (domainData: DomainUpdateFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await update(domainData);
      const options: AlertPartialOptions = {
        title: 'Domain Updated',
        text: `The domain record for ${domainData.domain} has been updated.`,
        onConfirm: (): void => dispatch(resetAlert()) && dispatch(updateDomain(domainData)),
      };
      dispatch(setSuccess(options));
    } catch (error) {
      dispatch(setError('Failed to update domain. Please check credentials and try again.'));
    }
  };

const createNewDomain: ThunkActionCreator = (domain: DomainFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const newDomain = await createDomain(domain);
      const options: AlertPartialOptions = {
        title: 'Domain Created',
        text: `${newDomain.domain} has been created as a new domain.`,
        onConfirm: (): void => R.forEach(dispatch, [resetAlert(), updateDomain(newDomain)]),
      };
      dispatch(setSuccess(options));
    } catch (error) {
      dispatch(setError('Failed to create domain. Please check credentials and try again.'));
    }
  };

module.exports = {
  getDomains,
  setDomains,
  deleteDomain,
  createNewDomain,
  updateDomainRecord,
  uploadImage,
  uploadImageSuccess,
  uploadImageCancel,
};
