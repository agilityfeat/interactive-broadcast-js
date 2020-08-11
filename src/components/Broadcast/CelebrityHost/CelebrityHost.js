// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { toastr } from 'react-redux-toastr';
import classNames from 'classnames';
import { validateUser } from '../../../actions/auth';
import { initializeBroadcast } from '../../../actions/celebrityHost';
import { setBroadcastState, setBroadcastEventStatus, startCountdown } from '../../../actions/broadcast';
import { setInfo, resetAlert } from '../../../actions/alert';
import CelebrityHostHeader from './components/CelebrityHostHeader';
import CelebrityHostBody from './components/CelebrityHostBody';
import Loading from '../../../components/Common/Loading';
import NoEvents from '../../../components/Common/NoEvents';
import Chat from '../../../components/Common/Chat';
import UniversalChat from '../../Common/UniversalChat';
import NetworkReconnect from '../../Common/NetworkReconnect';
import { disconnect } from '../../../services/opentok';
import './CelebrityHost.css';

// #region beautify preserve:start

type InitialProps = { params: { hostUrl: string, celebrityUrl: string } };
type BaseProps = {
  userType: 'host' | 'celebrity',
  userUrl: string,
  broadcast: BroadcastState,
  disconnected: boolean,
  authError: Error,
  isEmbed: boolean
};
type DispatchProps = {
  init: CelebHostInitOptions => void,
  changeEventStatus: (event: EventStatus) => void
};
type Props = InitialProps & BaseProps & DispatchProps;
// #endregion beautify preserve:end */

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

class CelebrityHost extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;
  signalListener: SignalListener;

  componentDidMount() {
    const { userType, userUrl, init } = this.props;
    const options = {
      userType,
      userUrl,
    };
    init(options);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (R.pathEq(['broadcast', 'event', 'status'], 'closed', nextProps)) { disconnect(); }
  }

  render(): ReactComponent {
    const { userType, broadcast, disconnected, authError, isEmbed, settings } = this.props;
    const { event, participants, privateCall, chats } = broadcast;
    const producerChat = R.prop('producer', chats);
    if (authError) return <NoEvents />;
    if (!event) return <Loading />;
    const mainClassNames = classNames('CelebrityHost', { CelebrityHostEmbed: isEmbed });
    return (
      <div className={mainClassNames}>
        <NetworkReconnect />
        <div className="Container">
          <CelebrityHostHeader
            name={event.name}
            status={event.status}
            userType={userType}
            privateCall={privateCall}
            disconnected={disconnected}
          />
          <CelebrityHostBody
            settings={settings}
            producerHost={event.producerHost}
            endImage={event.endImage}
            participants={participants}
            status={event.status}
            userType={userType}
          />
          <div className="HostCelebChat" >
            { producerChat && <Chat chat={producerChat} /> }
            <UniversalChat />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { hostUrl, celebrityUrl } = ownProps.params;
  return {
    userType: R.path(['route', 'userType'], ownProps),
    isEmbed: R.path(['route', 'embed'], ownProps),
    userUrl: hostUrl || celebrityUrl,
    broadcast: R.prop('broadcast', state),
    disconnected: R.path(['broadcast', 'disconnected'], state),
    authError: R.path(['auth', 'error'], state),
    settings: R.path(['settings'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: CelebHostInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  showCountdown: (): void => dispatch(startCountdown()),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CelebrityHost));
