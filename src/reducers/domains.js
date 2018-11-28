// @flow
import R from 'ramda';

const domains = (state: DomainMap = {}, action: ManageDomainsAction): DomainMap => {
  switch (action.type) {
    case 'SET_DOMAINS':
      return action.domains;
    case 'UPDATE_DOMAIN':
      return R.assoc(action.domain.id, R.merge(state[action.domain.id], action.domain), state);
    case 'REMOVE_DOMAIN':
      return R.omit([action.domainId], state);
    default:
      return state;
  }
};

export default domains;
