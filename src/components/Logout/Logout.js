// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import Icon from 'react-fontawesome';
import { signOut } from '../../actions/auth';
import { disconnectFromInstance } from '../../services/opentok';
import { leaveTheLine } from '../../actions/fan';
import './Logout.css';

/* beautify preserve:start */
type BaseProps = { event: Event, currentUser: User };
type DispatchProps = { leaveLine: Unit, logOutUser: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */


class Logout extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleLogout: UnitPromise;
  async handleLogout(): AsyncVoid {
    const { currentUser } = this.props;

    await disconnectFromInstance('stage');
    if (currentUser.isViewer) { await this.props.leaveLine(); }
    await this.props.logOutUser();
  }

  render(): ReactComponent {
    const { currentUser } = this.props;
    const to = currentUser && currentUser.isViewer ? null : '/admin';

    return (
      currentUser &&
        <span className="Logout">
          <Link to={to} className="link white">{currentUser.displayName}</Link>
          <span className="divider">|</span>
          <button className="Logout-btn btn" onClick={this.handleLogout}>Logout <Icon name="sign-out" size="lg" /></button>
        </span>
    );
  }
}


const mapStateToProps = (state: { currentUser: User }): BaseProps => ({
  currentUser: R.prop('currentUser', state),
  event: R.path(['broadcast', 'event'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    logOutUser: (): void => dispatch(signOut()),
    leaveLine: (): void => dispatch(leaveTheLine()),
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Logout));
