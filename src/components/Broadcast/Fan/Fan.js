// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import { setBroadcastEventStatus, displayUniversalChat, displayPrivateChat } from '../../../actions/broadcast';
import { initializeBroadcast, getInLine, leaveTheLine, setPublisherMinimized } from '../../../actions/fan';
import FanHeader from './components/FanHeader';
import FanBody from './components/FanBody';
import FanStatusBar from './components/FanStatusBar';
import Loading from '../../../components/Common/Loading';
import NoEvents from '../../Common/NoEvents';
import RegisterViewer from '../../../components/RegisterViewer/RegisterViewer';
import Chat from '../../../components/Common/Chat';
import UniversalChat from '../../Common/UniversalChat';
import NetworkReconnect from '../../Common/NetworkReconnect';
import { disconnect } from '../../../services/opentok';
import './Fan.css';

// #region beautify preserve
type InitialProps = {
  fitMode: boolean,
  params: { fanUrl: string, domainId: string }
};

type BaseProps = {
  domainId: string,
  userType: 'host' | 'celeb',
  userUrl: string,
  event: null | BroadcastEvent,
  inPrivateCall: boolean,
  status: EventStatus,
  broadcast: BroadcastState,
  backstageConnected: boolean,
  participants: BroadcastParticipants,
  fanStatus: FanStatus,
  producerChat: ChatState,
  ableToJoin: boolean,
  disconnected: boolean,
  postProduction: boolean,
  authError: Error,
  isEmbed: boolean,
  publisherMinimized: boolean,
  settings: Settings,
  user: User | null
};
type DispatchProps = {
  init: FanInitOptions => void,
  changeEventStatus: EventStatus => void,
  joinLine: Unit,
  leaveLine: Unit,
  minimizePublisher: Unit,
  restorePublisher: Unit
};
type Props = InitialProps & BaseProps & DispatchProps;
// #endregion

class Fan extends Component<Props> {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;

  componentDidMount() {
    const { settings, domainId, userType, user, userUrl, init, fitMode } = this.props;
    if (!settings.registrationEnabled || user) {
      const options = {
        domainId: domainId === settings.id ? domainId : null,
        userType,
        userUrl,
        fitMode,
      };
      init(options);
    }
  }

  componentWillUnmount() {
    this.props.leaveLine();
    disconnect();
  }

  componentWillReceiveProps(nextProps: Props) {
    // Need to check for change to event status here
    const { settings, domainId, userType, user, userUrl, init, fitMode } = this.props;
    if (R.pathEq(['event', 'status'], 'closed', nextProps)) { disconnect(); }
    if (!user && nextProps.user && nextProps.user.isViewer) {
      const options = {
        domainId: domainId === settings.id ? domainId : null,
        userType,
        userUrl,
        fitMode,
      };
      init(options);
    }
  }


  render(): ReactComponent {
    const { // $FlowFixMe
      event,
      status,
      authError,
      participants,
      userUrl,
      domainId,
      inPrivateCall,
      broadcast,
      joinLine,
      leaveLine,
      backstageConnected,
      fanStatus,
      producerChat,
      ableToJoin,
      disconnected,
      postProduction,
      user,
      isEmbed,
      publisherMinimized,
      minimizePublisher,
      restorePublisher,
      settings,
      showUniversalChat,
      showPrivateChat,
      settings: { registrationEnabled },
    } = this.props;

    if (!user && registrationEnabled) {
      return (
        <RegisterViewer
          eventMode
          domainId={domainId}
          userUrl={userUrl}
          event={event}
        />
      );
    }
    if (authError) return <NoEvents />;
    if (!event) return <Loading />;

    const participantIsConnected = (type: ParticipantType): boolean => R.path([type, 'connected'], participants || {});
    const hasStreams = event.producerHost ?
          R.any(participantIsConnected)(['host', 'celebrity', 'fan', 'producer']) :
          R.any(participantIsConnected)(['host', 'celebrity', 'fan']);

    const isClosed = R.equals(status, 'closed');
    const isLive = R.equals(status, 'live');
    const mainClassNames = classNames('Fan', { FanEmbed: isEmbed });

    return (
      <div className={mainClassNames}>
        <NetworkReconnect />
        <div className="Container">
          <FanHeader
            user={user}
            name={event.name}
            displayName={user && user.displayName}
            status={status}
            ableToJoin={ableToJoin}
            getInLine={joinLine}
            postProduction={postProduction}
            leaveLine={leaveLine}
            fanStatus={fanStatus}
            backstageConnected={backstageConnected}
            inPrivateCall={inPrivateCall}
            privateCall={broadcast.privateCall}
            disconnected={disconnected}
            showUniversalChat={showUniversalChat}
            showPrivateChat={showPrivateChat}
          />
          { !isClosed && <FanStatusBar fanStatus={fanStatus} /> }
          <FanBody
            producerHost={event.producerHost}
            settings={settings}
            publisherMinimized={publisherMinimized}
            restorePublisher={restorePublisher}
            minimizePublisher={minimizePublisher}
            hasStreams={hasStreams}
            image={isClosed ? event.endImage : event.startImage}
            participants={participants}
            isClosed={isClosed}
            isLive={isLive}
            fanStatus={fanStatus}
            backstageConnected={backstageConnected}
            ableToJoin={ableToJoin}
            hlsUrl={event.hlsUrl}
            postProduction={postProduction}
          />
          <div className="FanChat" >
            { producerChat && <Chat chat={producerChat} displayed /> }
            <UniversalChat />
          </div>
        </div>
      </div>
    );
  }
}

// #region Redux mappings
const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { fanUrl } = ownProps.params;
  return {
    user: state.currentUser,
    fitMode: R.path(['location', 'query', 'fitMode'], ownProps),
    domainId: R.path(['params', 'domainId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    isEmbed: R.path(['route', 'embed'], ownProps),
    postProduction: R.path(['fan', 'postProduction'], state),
    userUrl: fanUrl,
    inPrivateCall: R.path(['fan', 'inPrivateCall'], state),
    event: R.path(['broadcast', 'event'], state),
    status: R.path(['broadcast', 'event', 'status'], state),
    broadcast: R.path(['broadcast'], state),
    participants: R.path(['broadcast', 'participants'], state),
    ableToJoin: R.path(['fan', 'ableToJoin'], state),
    fanStatus: R.path(['fan', 'status'], state),
    backstageConnected: R.path(['broadcast', 'backstageConnected'], state),
    producerChat: R.path(['broadcast', 'chats', state.currentUser.id], state),
    disconnected: R.path(['broadcast', 'disconnected'], state),
    authError: R.path(['auth', 'error'], state),
    settings: R.path(['settings'], state),
    publisherMinimized: R.path(['fan', 'publisherMinimized'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: FanInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  showUniversalChat: (): void => dispatch(displayUniversalChat(true)),
  showPrivateChat: (): void => dispatch(displayPrivateChat(true)), // @CARLOS cambiar esta linea
  joinLine: (): void => dispatch(getInLine()),
  leaveLine: (): void => dispatch(leaveTheLine()),
  minimizePublisher: (): void => dispatch(setPublisherMinimized(true)),
  restorePublisher: (): void => dispatch(setPublisherMinimized(false)),
});
// #endregion

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Fan));
