// @flow
import { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';

type Props = {
  children: ReactComponent[],
  currentUser: User
};

class AdminRoutes extends Component {
  props: Props;

  componentWillMount() {
    const { currentUser } = this.props;

    if (!currentUser || currentUser.isViewer) {
      browserHistory.replace('/admin');
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const { currentUser } = nextProps;

    if (!currentUser || currentUser.isViewer) {
      browserHistory.replace('/admin');
    }
  }

  render(): ReactComponent {
    return this.props.currentUser ? this.props.children : null;
  }
}

const mapStateToProps = (state: State): Props => R.pick(['currentUser'], state);
export default connect(mapStateToProps)(AdminRoutes);

