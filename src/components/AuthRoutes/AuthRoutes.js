// @flow
import { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';

type Props = {
  children: ReactComponent[],
  currentUser: User,
  settings: Settings
};

class AuthRoutes extends Component {
  props: Props;

  componentWillMount() {
    const { currentUser, settings } = this.props;
    const authorized = currentUser || !settings.registerEnabled;

    if (!authorized) {
      browserHistory.replace('/');
    }
  }

  render(): ReactComponent {
    const { currentUser, settings } = this.props;
    const authorized = currentUser || !settings.registerEnabled;

    return authorized ? this.props.children : null;
  }
}

const mapStateToProps = (state: State): Props =>
  R.pick(['currentUser', 'settings'], state);
export default connect(mapStateToProps)(AuthRoutes);

