// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import VideoHolder from '../../../Common/VideoHolder';
import FanHLSPlayer from './FanHLSPlayer';
import './FanBody.css';
import defaultImg from '../../../../images/uni-brand-wide.png';

const userTypes: ParticipantType[] = ['host', 'celebrity', 'fan'];

type Props = {
  isClosed: boolean,
  isLive: boolean,
  image?: EventImage,
  participants: BroadcastParticipants,
  hasStreams: boolean,
  backstageConnected: boolean,
  fanStatus: FanStatus,
  ableToJoin: boolean,
  hlsUrl: string,
  postProduction: boolean,
  publisherMinimized: boolean,
  restorePublisher: Unit,
  minimizePublisher: Unit,
  settings: SettingsState,
  producerHost: boolean
};

const FanBody = (props: Props): ReactComponent => {
  const {
    isClosed,
    isLive,
    image,
    participants,
    hasStreams,
    backstageConnected,
    fanStatus,
    ableToJoin,
    hlsUrl,
    postProduction,
    publisherMinimized,
    minimizePublisher,
    restorePublisher,
    settings,
    producerHost,
  } = props;
  const fanOnStage = R.equals('stage', fanStatus);
  const showImage = ((!isLive && !postProduction) || (!hasStreams && ableToJoin)) && !fanOnStage;
  const hidePublisher = isClosed || !backstageConnected || fanOnStage;
  const shouldSubscribe = isLive || fanOnStage || postProduction;
  const showHLSPlayer = isLive && !ableToJoin && hlsUrl;
  const isInLine = fanStatus !== 'disconnected' && fanStatus !== 'connected';
  const mainClassNames = classNames('FanBody', { inLine: isInLine });
  const imgHolderDefault = settings.siteLogo ? settings.siteLogo.url : defaultImg;
  const backgroundDefault = !image && settings ? settings.siteColor : '#fff';
  return (
    <div className={mainClassNames}>
      { showImage &&
        <div className="imageHolder" style={{ background: backgroundDefault }}>
          <img src={image ? image.url : imgHolderDefault} alt="event" className={image ? '' : 'default'} />
        </div>
      }
      { !isClosed &&
      userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={(!!participants[type] && participants[type].connected && shouldSubscribe) || (fanOnStage && type === 'fan')}
          userType={type}
        />)
      }
      { !isClosed && producerHost ?
        <VideoHolder
          key="videoStreamproducer"
          connected={shouldSubscribe && participants && participants.producer && participants.producer.connected}
          userType="producer"
        /> :
        <div id="videoproducer" className="producerContainer" />
      }
      { showHLSPlayer && <FanHLSPlayer isLive={isLive} hlsUrl={hlsUrl} /> }
      <div className={classNames('publisherWrapper', { hidePublisher, minimized: publisherMinimized })}>
        <div className="publisherActions">
          { !publisherMinimized && <button onClick={minimizePublisher}><i className="fa fa-minus minimize" /></button> }
          { publisherMinimized && <button onClick={restorePublisher}><i className="fa fa-video-camera restore" /></button> }
        </div>
        <div className={classNames('VideoWrap', 'smallVideo', { hidePublisher: hidePublisher || publisherMinimized })} id="videobackstageFan" />
      </div>
    </div>
  );
};

export default FanBody;
