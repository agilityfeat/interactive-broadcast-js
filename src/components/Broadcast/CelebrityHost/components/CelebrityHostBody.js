// @flow
import React from 'react';
import classNames from 'classnames';
import VideoHolder from '../../../Common/VideoHolder';
import './CelebrityHostBody.css';
import defaultImg from '../../../../images/uni-brand-wide.png';

const userTypes: ParticipantType[] = ['host', 'celebrity', 'fan'];

type Props = {
  status: EventStatus,
  endImage?: EventImage,
  participants: null | BroadcastParticipants,
  userType: 'host' | 'celebrity' | 'producer',
  settings: SettingsState,
  producerHost: boolean
};

const CelebrityHostBody = (props: Props): ReactComponent => {
  const { status, producerHost, endImage, participants, userType, settings } = props;
  const isClosed = status === 'closed';
  const imgClass = classNames('CelebrityHostBody', { withStreams: !isClosed });
  const endImageUrl = endImage ? endImage.url : null;
  const closeImageClass = classNames('closeImage', { default: !endImageUrl });
  const imgHolderDefault = settings && settings.siteLogo ? settings.siteLogo.url : defaultImg;
  const backgroundDefault = !endImageUrl && settings ? settings.siteColor : '#fff';

  return (
    <div className={imgClass}>
      { isClosed &&
        <div className="closeImageHolder" style={{ background: backgroundDefault }}>
          <img src={endImageUrl || imgHolderDefault} alt="event ended" className={closeImageClass} />
        </div>
      }
      { !isClosed && userTypes.map((type: ParticipantType): ReactComponent =>
        <VideoHolder
          key={`videoStream${type}`}
          connected={participants && participants[type] && participants[type].connected}
          isMe={userType === type}
          userType={type}
        />)
      }
      {
        producerHost ?
          <VideoHolder
            key="videoStreamproducer"
            connected={participants && participants.producer && participants.producer.connected}
            userType="producer"
          /> :
          <div id="videoproducer" className="producerContainer" />
      }
    </div>
  );
};

export default CelebrityHostBody;
