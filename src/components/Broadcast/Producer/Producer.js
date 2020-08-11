// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import ProducerHeader from './components/ProducerHeader';
import ProducerSidePanel from './components/ProducerSidePanel';
import ProducerPrimary from './components/ProducerPrimary';
import NetworkReconnect from '../../Common/NetworkReconnect';
import ProducerChat from './components/ProducerChat';
import { initializeBroadcast, resetBroadcastEvent } from '../../../actions/producer';
import { displayGlobalChat, displayUniversalChat } from '../../../actions/broadcast';
import './Producer.css';

// #region beautify preserve:start
type InitialProps = { params: { id?: string } };

type BaseProps = {
  user: User,
  eventId: EventId,
  broadcast: BroadcastState
};

type DispatchProps = {
  setEvent: EventId => void,
  resetEvent: Unit
};

type Props = InitialProps & BaseProps & DispatchProps;
// #endregion beautify preserve:end

class Producer extends Component {
  props: Props;
  state: { preshowStarted: boolean, showingSidePanel: boolean };
  startPreshow: Unit;
  toggleSidePanel: Unit;
  signalListener: Signal => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      preshowStarted: false,
      showingSidePanel: true,
    };
    this.toggleSidePanel = this.toggleSidePanel.bind(this);
  }

  toggleSidePanel() {
    this.setState({ showingSidePanel: !this.state.showingSidePanel });
  }

  componentDidMount() {
    const { setEvent, eventId } = this.props;
    setEvent(eventId);
  }

  componentWillUnmount() {
    this.props.resetEvent();
  }

  render(): ReactComponent {
    const { toggleSidePanel } = this;
    const { showingSidePanel } = this.state;
    const { broadcast, showGlobalChat, showUniversalChat } = this.props;

    return (
      <div className="Producer">
        <NetworkReconnect />
        <div className={classNames('Producer-main', { full: !showingSidePanel })} >
          <ProducerHeader
            showingSidePanel={showingSidePanel}
            toggleSidePanel={toggleSidePanel}
          />
          <ProducerPrimary />
        </div>
        <ProducerSidePanel
          showGlobalChat={showGlobalChat}
          showUniversalChat={showUniversalChat}
          hidden={!showingSidePanel}
          broadcast={broadcast}
        />
        <ProducerChat chats={broadcast.chats} />
      </div>
    );
  }
}

// #region Redux maps
const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr('', ['params', 'id'], ownProps),
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    showGlobalChat: (): void => dispatch(displayGlobalChat(true)),
    showUniversalChat: (): void => dispatch(displayUniversalChat(true)),
    setEvent: (eventId: EventId) => {
      dispatch(initializeBroadcast(eventId, 'producer'));
    },
    resetEvent: () => {
      dispatch(resetBroadcastEvent());
    },
  });
// #endregion

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Producer));
