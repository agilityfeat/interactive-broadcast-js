// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory, Link } from 'react-router';
import { getDomains } from '../../actions/domains';
import DomainList from './components/DomainList';
import './Domains.css';

/* beautify preserve:start */
type InitialProps = { params: { adminId: string } };
type BaseProps = {
  adminId: string,
  currentUser: User
};
type DispatchProps = { getDomains: Unit };
type Props = InitialProps & BaseProps & DispatchProps;


/* beautify preserve:end */

class Domains extends Component {
  props: Props;

  componentWillMount() {
    if (!this.props.currentUser.superAdmin && this.props.currentUser.id !== this.props.adminId) {
      browserHistory.replace('/');
    }
  }

  componentDidMount() {
    this.props.getDomains();
  }

  render(): ReactComponent {
    const { adminId } = this.props;
    return (
      <div className="Domains">
        <div className="DomainsHeader admin-page-header">
          <Link to="admin">Back to Events</Link>
          <h3>{ !adminId ? 'Domains' : 'My profile' }</h3>
        </div>
        <div className="admin-page-content">
          <DomainList />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  adminId: R.path(['params', 'adminId'], ownProps),
  currentUser: R.path(['currentUser'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    getDomains: () => {
      dispatch(getDomains());
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Domains);
