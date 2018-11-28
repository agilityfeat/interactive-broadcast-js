// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Icon from 'react-fontawesome';
import { deleteDomain as removeDomain } from '../../../actions/domains';
import './DomainActions.css';

/** Event Actions */
type BaseProps = { domain: Domain, toggleEditPanel: Unit };
type DispatchProps = { deleteDomain: DomainId => void };
type InitialProps = { adminId: string };
type Props = BaseProps & DispatchProps & InitialProps;
const DomainActions = ({ domain, deleteDomain, toggleEditPanel, adminId }: Props): ReactComponent =>
  <div className="DomainActions">
    <button className="btn action orange" onClick={toggleEditPanel}><Icon name="pencil" />Edit</button>
    { !adminId && <button className="btn action red" onClick={R.partial(deleteDomain, [domain.id])}><Icon name="remove" />Delete</button> }
  </div>;

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  adminId: R.path(['params', 'adminId'], ownProps),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    deleteDomain: (domainId: DomainId) => {
      dispatch(removeDomain(domainId));
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DomainActions));
