// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import { getBroadcastEvents } from '../../actions/events';
import Loading from '../../components/Common/Loading';
import defaultImg from '../../images/TAB_VIDEO_PREVIEW_LS.jpg';
import './ViewEvent.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: EventId } };
type BaseProps = {
  user: CurrentUserState,
  events: null | BroadcastEventMap,
  eventId: null | EventId,
  siteLogo: null | string
};
type DispatchProps = {
  loadEvents: (string, boolean) => void
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class UpdateEvent extends Component {
  props: Props;

  componentDidMount() {
    if (!this.props.events) {
      const { user, domainId } = this.props;
      this.props.loadEvents(domainId, user.superAdmin);
    }
  }
  render(): ReactComponent {
    const { eventId, events, siteLogo } = this.props;
    const event = events && R.find(R.propEq('id', eventId))(events);
    if (!event) return <Loading />;

    const poster = R.pathOr(siteLogo || defaultImg, ['startImage', 'url'], event);
    return (
      <div className="ViewEvent">
        <div className="ViewEvent-header">
          <Link to="/admin">Back to Events</Link>
          <h3>{event.name}</h3>
        </div>
        <div className="ViewEvent-video-container">
          <div className="ViewEvent-video-flex">
            <div className="img-container">
              <img alt="preview video" src={poster} />
            </div>
            <video src={event.archiveUrl} preload="metadata" poster="data:image/gif,AAAA" controls />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr(null, ['params', 'id'], ownProps),
  events: R.path(['events', 'map'], state),
  domainId: R.path(['settings', 'id'], state),
  siteLogo: R.pathOr(null, ['settings', 'siteLogo', 'url'], state),
  user: state.currentUser,
  state,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  loadEvents: (domainId: string, superAdmin: boolean = false) => {
    dispatch(getBroadcastEvents(domainId, superAdmin));
  },
});


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UpdateEvent));
