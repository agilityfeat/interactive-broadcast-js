// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { getBroadcastEvents } from '../../actions/events';
import EventFile from './components/EventFile';
import './Files.css';

/* beautify preserve:start */
type BaseProps = { currentUser: User, events: EventsState, settings: Settings };
type DispatchProps = { loadEvents: UserId => void };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Dashboard extends Component<Props> {
  props: Props;

  componentDidMount() {
    const { currentUser, loadEvents, settings } = this.props;
    const { registrationEnabled, fileSharingEnabled } = settings;
    const shouldLogin = !currentUser && registrationEnabled && fileSharingEnabled;
    const shouldAdmin = !fileSharingEnabled;


    if (shouldLogin) {
      browserHistory.replace('/login');
    }

    if (shouldAdmin) {
      browserHistory.replace('/admin');
    }

    if (!shouldLogin && !shouldAdmin) loadEvents(settings.id);
  }

  render(): ReactComponent {
    const { events, settings } = this.props;
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
      </div>
    );
  }
}


const mapStateToProps = (state: State): BaseProps => R.pick(['currentUser', 'events', 'settings'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (domainId: string) => {
      dispatch(getBroadcastEvents(domainId));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
