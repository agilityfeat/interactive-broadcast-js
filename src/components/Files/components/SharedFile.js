// @flow
import React from 'react';
import './SharedFile.css';


type Props = {
  file: SharedFile,
  settings: Settings
};

const SharedFileComponent = (props: Props): ReactComponent => {
  const { settings, file } = props;
  const image = file.type.startsWith('image') ? file : settings.siteLogo;

  return (
    <a className="SharedFile" href={file.url} rel="noopener noreferer" target="_blank">
      <div className="SharedFile-content">
        <div className="SharedFile-img-container">
          <img alt="event-recording" src={image.url} />
        </div>
      </div>
      <div className="SharedFile-info">
        <div className="SharedFile-namedate">
          {file.name}
        </div>
      </div>
    </a>
  );
};

export default SharedFileComponent;
