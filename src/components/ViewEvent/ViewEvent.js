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
  siteLogo: null | string,
  domainId: string
};
type DispatchProps = {
  loadEvents: (string) => void
};
type Props = InitialProps & BaseProps & DispatchProps;
type UpdateEventState = { showImage: boolean };
/* beautify preserve:end */

class UpdateEvent extends Component<Props, UpdateEventState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showImage: true,
    };

    this.imageToggle = this.imageToggle.bind(this);
  }

  componentDidMount() {
    if (!this.props.events) {
      const { domainId } = this.props;
      this.props.loadEvents(domainId);
    }
  }

  imageToggle: Unit;
  imageToggle() {
    this.setState({ showImage: !this.state.showImage });
  }

  render(): ReactComponent {
    const { eventId, events, siteLogo } = this.props;
    const event = events && R.prop(eventId, events);
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
              <div className="img-center">
                <img alt="preview video" src={poster} />
              </div>
            </div>
            <video
              onPlay={this.imageToggle}
              onPause={this.imageToggle}
              src={event.archiveUrl}
              style={{ zIndex: this.state.showImage ? 'auto' : 1 }}
              preload="metadata"
              poster="data:image/gif,AAAA"
              controls
            />
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
