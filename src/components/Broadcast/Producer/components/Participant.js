// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import { loadUrls } from '../../../../services/eventUrls';
import { isFan, translateRole } from '../../../../services/util';
import ControlIcon from './ControlIcon';
import { toggleParticipantProperty, screenShareAction } from '../../../../actions/broadcast';
import { connectPrivateCall, chatWithParticipant, sendToStage, kickFanFromFeed } from '../../../../actions/producer';
import './Participant.css';

const isBackstageFan = R.equals('backstageFan');
const isOnStageFan = R.equals('fan');

const getHeaderLabel = (type: string): string => R.toUpper(translateRole(type));

type OwnProps = {
  type: ParticipantType
};

type BaseProps = {
  broadcast: BroadcastState,
  fanRecord: ActiveFan | null
};

type DispatchProps = {
  toggleAudio: Unit,
  toggleVideo: Unit,
  screenShareAction: Unit,
  toggleVolume: Unit,
  privateCall: Unit,
  chat: Unit,
  kickFan: Unit,
  sendFanToStage: Unit
};

type Props = OwnProps & BaseProps & DispatchProps;

class Participant extends React.Component {
  constructor(props: Props) {
    super(props);
    this.state = { url: null };

    this.handleScreenShareRequest = this.handleScreenShareRequest.bind(this);
  }

  async componentDidUpdate(prevProps: Props): void {
    if (!prevProps.broadcast.event && this.props.broadcast.event) {
      const { broadcast, type } = this.props;
      const urls = await loadUrls(broadcast.event || {});
      // eslint-disable-next-line
      this.setState({ url: R.prop(`${type}Url`, urls) });
    }
  }

  handleScreenShareRequest() {
    const { type, requestScreenShare, broadcast } = this.props;
    const me = R.prop(type, broadcast.participants) || {};
    requestScreenShare(me.screen ? 'end' : 'start');
  }

  render(): ReactComponent {
    const {
      type,
      toggleAudio,
      toggleVideo,
      toggleVolume,
      privateCall,
      chat,
      kickFan,
      broadcast,
      sendFanToStage,
      screenSharingEnabled,
      fanRecord,
    } = this.props;
    const fanId = R.prop('id', fanRecord || {});
    const me = R.prop(type, broadcast.participants) || {};
    const stageCountdown = broadcast.stageCountdown;
    const inPrivateCall = R.pathEq(['privateCall', 'isWith'], type, broadcast);
    const availableForPrivateCall = (): boolean => {
      const inPreshow = R.pathEq(['event', 'status'], 'preshow', broadcast);
      return (me.connected && (inPreshow || isBackstageFan(type)));
    };
    const statusIconClass = classNames('icon', { green: me.connected });
    const controlIconClass = classNames('icon', { active: me.connected });
    const volumeIconDisabled = (!inPrivateCall && isBackstageFan(type)) || !me.connected;
    const volumeIconClass = classNames('icon', { active: !volumeIconDisabled });
    const privateCallIconClass = classNames('icon', { active: me.connected && availableForPrivateCall() });
    const status = me.connected ? 'Online' : 'Offline';
    return (
      <div className="Participant">
        <div className="Participant-header">
          <span className="label" >{ getHeaderLabel(type) } </span>
          <span><Icon className={statusIconClass} name="circle" />{status}</span>
        </div>
        <div className="Participant-video" id={`video${type}`}>
          { !me.audio && me.connected && <div className="Participant-muted">MUTED</div> }
          { me.screen && me.connected && <div className="Participant-muted">SCREENSHARING</div> }
          { isOnStageFan(type) && stageCountdown >= 0 &&
            <div className="countdown-overlay">
              <span className="countdown-text">{stageCountdown}</span>
            </div>
          }
        </div>
        { isBackstageFan(type) ?
          <div className="Participant-move-fan">
            <button className="move btn transparent" onClick={sendFanToStage}>Move to {translateRole('fan')} feed</button>
          </div> :
          <div className="Participant-url">
            <span className="url">{ this.state.url }</span>
            <CopyToClipboard text={this.state.url || ''} onCopyText="URL">
              <button className="btn white">COPY</button>
            </CopyToClipboard >
          </div>
        }
        <div className="Participant-feed-controls">
          <span className="label">Alter Feed</span>
          <div className="controls">
            <ControlIcon
              name={me.volume === 100 ? 'volume-up' : 'volume-down'}
              className={volumeIconClass}
              disabled={volumeIconDisabled}
              onClick={toggleVolume}
            />
            <ControlIcon
              name={inPrivateCall ? 'phone-square' : 'phone'}
              className={privateCallIconClass}
              disabled={!availableForPrivateCall()}
              onClick={R.partial(privateCall, [fanId])}
            />
            <ControlIcon
              name={me.audio ? 'microphone' : 'microphone-slash'}
              disabled={!me.connected}
              className={controlIconClass}
              onClick={toggleAudio}
            />
            { !R.contains('fan', R.toLower(type)) &&
              screenSharingEnabled &&
              <ControlIcon
                name="desktop"
                className={controlIconClass}
                onClick={this.handleScreenShareRequest}
                disabled={!me.connected}
              />
            }
            <ControlIcon
              name="video-camera"
              className={controlIconClass}
              onClick={toggleVideo}
              disabled={!me.connected}
            />
            { R.contains('fan', R.toLower(type)) ?
              <ControlIcon name="ban" className={controlIconClass} onClick={kickFan} disabled={!me.connected} /> :
              <ControlIcon name="comment" onClick={chat} className={controlIconClass} disabled={!me.connected} />
            }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: OwnProps): BaseProps => ({
  screenSharingEnabled: R.path(['settings', 'screenSharingEnabled'], state),
  broadcast: R.prop('broadcast', state),
  fanRecord: isFan(ownProps.type) ? R.path(['broadcast', 'participants', ownProps.type, 'record'], state) : null,
});

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps, OwnProps> = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
  toggleAudio: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'audio')),
  toggleVideo: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'video')),
  toggleVolume: (): void => dispatch(toggleParticipantProperty(ownProps.type, 'volume')),
  requestScreenShare: (action: string): void => dispatch(screenShareAction(action, ownProps.type)),
  privateCall: (fanId?: UserId): void => dispatch(connectPrivateCall(ownProps.type, fanId)),
  kickFan: (): void => dispatch(kickFanFromFeed(ownProps.type)),
  chat: (): void => dispatch(chatWithParticipant(ownProps.type)),
  sendFanToStage: (): void => dispatch(sendToStage()),
});


export default connect(mapStateToProps, mapDispatchToProps)(Participant);
