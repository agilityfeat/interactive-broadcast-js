// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { getBroadcastEvents } from '../../actions/events';
import { getSharedFiles } from '../../actions/files';
import EventFile from './components/EventFile';
import SharedFile from './components/SharedFile';
import './Files.css';

/* beautify preserve:start */
type BaseProps = { currentUser: User, events: EventsState, settings: Settings };
type DispatchProps = { loadEvents: (string) => void, loadSharedFiles: (string) => void };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Dashboard extends Component<Props> {
  props: Props;

  componentDidMount() {
    const { currentUser, loadEvents, settings, loadSharedFiles } = this.props;
    const { registrationEnabled, fileSharingEnabled } = settings;
    const shouldLogin = !currentUser && registrationEnabled && fileSharingEnabled;
    const shouldAdmin = !fileSharingEnabled;


    if (shouldLogin) {
      browserHistory.replace('/login');
    }

    if (shouldAdmin) {
      browserHistory.replace('/admin');
    }

    if (!shouldLogin && !shouldAdmin) {
      loadSharedFiles(settings.id);
      loadEvents(settings.id);
    }
  }

  render(): ReactComponent {
    const { events, settings, files } = this.props;

    return (
      <div className="Files">
        <div className="Files-header">
          <h2>Recent Files</h2>
        </div>
        <div className="Files-container">
          {events.map && Object.keys(events.map).map((k: EventId): ReactComponent => (
            events.map[k].archiveUrl &&
              <EventFile key={k} settings={settings} event={events.map[k]} />
          ))}
        </div>
        {files.sharedByMe &&
          <div>
            <div className="Files-header">
              <h4>Files Shared By Me</h4>
            </div>
            <div className="Files-container">
              {files.sharedByMe && Object.keys(files.sharedByMe).map((k: string): ReactComponent => (
                <SharedFile key={k} settings={settings} file={files.sharedByMe[k]} />
              ))}
            </div>
          </div>
        }
        {files.sharedWithMe &&
          <div>
            <div className="Files-header">
              <h4>Files Shared With Me</h4>
            </div>
            <div className="Files-container">
              {files.sharedWithMe && Object.keys(files.sharedWithMe).map((k: string): ReactComponent => (
                <SharedFile key={k} settings={settings} file={files.sharedWithMe[k]} />
              ))}
            </div>
          </div>
        }
        {files.sharedWithAll &&
          <div>
            <div className="Files-header">
              <h4>Files Shared With Everyone</h4>
            </div>
            <div className="Files-container">
              {files.sharedWithAll && Object.keys(files.sharedWithAll).map((k: string): ReactComponent => (
                <SharedFile key={k} settings={settings} file={files.sharedWithAll[k]} />
              ))}
            </div>
          </div>
        }
      </div>
    );
  }
}


const mapStateToProps = (state: State): BaseProps => R.pick(['currentUser', 'events', 'settings', 'files'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (domainId: string) => { dispatch(getBroadcastEvents(domainId)); },
    loadSharedFiles: (domainId: string) => { dispatch(getSharedFiles(domainId)); },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
