// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { getBroadcastEvents } from '../../actions/events';
import DashboardHeader from './components/DashboardHeader';
import DashboardEvents from './components/DashboardEvents';
import './Dashboard.css';

/* beautify preserve:start */
type BaseProps = { currentUser: User, events: EventsState, settings: Settings };
type DispatchProps = { loadEvents: UserId => void };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Dashboard extends Component {
  props: Props;

  componentDidMount() {
    const { loadEvents, settings } = this.props;
    loadEvents(settings.id);
  }

  render(): ReactComponent {
    return (
      <div className="Dashboard">
        <DashboardHeader />
        <DashboardEvents events={this.props.events} />
      </div>
    );
  }
}


const mapStateToProps = (state: State): BaseProps => R.pick(['currentUser', 'events', 'settings'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (domainId: string, superAdmin: boolean = false) => {
      dispatch(getBroadcastEvents(domainId, superAdmin));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
