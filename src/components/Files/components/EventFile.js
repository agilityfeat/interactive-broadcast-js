// @flow
import React from 'react';
import moment from 'moment';
import './EventFile.css';


type Props = {
  event: Event,
  settings: Settings
};

const EventFile = (props: Props): ReactComponent => {
  const { settings, event } = props;
  const image = event.startImage || settings.siteLogo;
  const date = moment(event.startDate);

  return (
    <a className="EventFile" href={event.archiveUrl}>
      <div className="EventFile-content">
        <img alt="event-recording" src={image.url} />
        <div className="EventFile-info">
          <div className="EventFile-namedate">
            {event.name} - {date.format('DD/MM/YYYY')}
          </div>
          <div className="EventFile-info"> Author: {event.adminName} </div>
        </div>
      </div>
    </a>
  );
};

export default EventFile;
