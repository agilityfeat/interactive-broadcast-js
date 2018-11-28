// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import shortid from 'shortid';
import classNames from 'classnames';
import moment from 'moment';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../Common/CopyToClipboard';
import Label from '../../Common/Label';
import DatePicker from '../../Common/DatePicker';
import firebase from '../../../services/firebase';
import { createUrls } from '../../../services/eventUrls';
import { uploadEventImage, uploadEventImageSuccess, uploadEventImageCancel } from '../../../actions/events';
import './EventForm.css';

/* beautify preserve:start */
type BaseProps = {
  onSubmit: Unit,
  onUpdate: string => void,
  user: User,
  event: BroadcastEvent,
  errors: null | { fields: {[field: string]: boolean}, message: string },
  submitting: false
};
type DispatchProps = {
  uploadImage: Unit,
  uploadImageSuccess: Unit,
  uploadImageCancel: Unit
};
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

type EventFormState = {
  fields: {
    name: string,
    startImage: null | EventImage,
    endImage: null | EventImage,
    fanUrl: string,
    fanAudioUrl: string,
    hostUrl: string,
    celebrityUrl: string,
    archiveEvent: boolean,
    redirectUrl: string,
    rtmpUrl: string,
    dateTimeStart: string,
    dateTimeEnd: string,
    uncomposed: boolean
  },
  submitting: boolean
};

const eventFields = [
  'name',
  'startImage',
  'endImage',
  'fanUrl',
  'fanAudioUrl',
  'hostUrl',
  'celebrityUrl',
  'archiveEvent',
  'redirectUrl',
  'rtmpUrl',
  'dateTimeStart',
  'dateTimeEnd',
  'uncomposed',
];

class EventForm extends Component {

  props: Props;
  state: EventFormState;
  handleSubmit: Unit;
  handleChange: Unit;
  uploadFile: Unit;
  updateURLs: Unit;
  onCopy: string => void;
  onUpdate: string => void;
  onUploadFinish: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: {
        name: '',
        startImage: null,
        endImage: null,
        dateTimeStart: moment().startOf('hour').format('MM/DD/YYYY hh:mm:ss a'),
        dateTimeEnd: moment().startOf('hour').add(1, 'h').format('MM/DD/YYYY hh:mm:ss a'),
        archiveEvent: true,
        fanUrl: '',
        fanAudioUrl: '',
        hostUrl: '',
        celebrityUrl: '',
        redirectUrl: '',
        rtmpUrl: '',
        uncomposed: false,
      },
      submitting: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.updateURLs = this.updateURLs.bind(this);
  }

  componentWillMount() {
    this.updateURLs();
    if (!R.isNil(this.props.event)) {
      this.setState({ fields: R.pick(eventFields, this.props.event) }, this.updateURLs);
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (R.isNil(nextProps.errors) || !nextProps.submitting) {
      this.setState({ submitting: false });
    }
    if (!R.isNil(nextProps.event)) {
      this.setState({ fields: R.pick(eventFields, this.props.event) }, this.updateURLs);
    }
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { fields } = this.state;
    this.setState({ submitting: true }, () => {
      onSubmit(fields);
    });
  }

  async uploadFile(e: SyntheticInputEvent): AsyncVoid {
    const field = e.target.name;
    const file = R.head(e.target.files);
    if (file) {
      this.props.uploadImage();
      const imageId = shortid.generate();
      const ref = firebase.storage().ref().child(`eventImages/${imageId}`);
      try {
        const snapshot: * = await ref.put(file);
        const imageData = { id: imageId, url: snapshot.downloadURL };
        this.setState({ fields: R.assoc(field, imageData, this.state.fields) });
        this.props.uploadImageSuccess();
      } catch (error) {
        console.log('Error uploading image', error);
        this.props.uploadImageCancel();
      }
    }
  }

  async updateURLs(): AsyncVoid {
    const { fields } = this.state;
    const { domainId } = this.props;
    const update = createUrls({ name: R.prop('name', fields), domainId });
    this.setState({ fields: R.merge(fields, update) });
  }

  handleChange(e: SyntheticInputEvent) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const field = e.target.name;
    this.setState({ fields: R.assoc(field, value, this.state.fields) }, this.updateURLs);
    this.props.onUpdate(field);
  }

  render(): ReactComponent {
    const { handleSubmit, handleChange, uploadFile } = this;
    const { errors } = this.props;
    const errorMessage = R.propOr('', 'message', errors);
    const errorFields = R.propOr({}, 'fields', errors);
    const { fields } = this.state;
    const { startImage, endImage } = fields;
    const hasAPIKey = this.props.user.otApiKey;
    const { audioOnlyEnabled } = this.props.user;
    return (
      <form className="EventForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="label">Name</div>
          <Icon className="icon" name="asterisk" style={{ color: 'darkgrey' }} />
          <input type="text" value={fields.name} name="name" onChange={handleChange} placeholder="Event Name" />
        </div>
        <div className="input-container date-time">
          <div className="label">Date and Time (optional)</div>
          <div className="date-time-container">
            <div className={classNames('time-selection', { error: errorFields.dateTimeStart })}>
              <Icon className="icon" name="calendar-o" style={{ color: 'darkgrey' }} />
              <DatePicker name="dateTimeStart" onChange={handleChange} value={fields.dateTimeStart} />
            </div>
            <div className="separation">to</div>
            <div className={classNames('time-selection', { error: errorFields.dateTimeEnd })} >
              <Icon className="icon" name="calendar-o" style={{ color: 'darkgrey' }} />
              <DatePicker name="dateTimeEnd" onChange={handleChange} value={fields.dateTimeEnd} />
            </div>
          </div>
        </div>
        <div className="input-container">
          <div className="label">Event Image</div>
          <Icon className="icon" name="image" style={{ color: 'darkgrey' }} />
          <input type="file" name="startImage" onChange={uploadFile} />
        </div>
        { startImage && <div className="event-image-preview"><img src={startImage.url} alt="start event" /></div> }
        <div className="input-container">
          <div className="label">End Event Image (optional)</div>
          <Icon className="icon" name="image" style={{ color: 'darkgrey' }} />
          <input type="file" name="endImage" onChange={uploadFile} />
        </div>
        { endImage && <div className="event-image-preview"><img src={endImage.url} alt="end event" /></div> }
        <div className="error-message-container">
          { errorMessage }
        </div>

        <div className="form-divider">
          <h4>Event URLs</h4>
        </div>

        <div className="input-container disabled">
          <div className="label">Viewer URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="fanUrl" value={fields.fanUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.fanUrl} onCopyText="Viewer URL" >
            <button className="btn white copy" type="button">
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Viewer URL
            </button>
          </CopyToClipboard>
        </div>
        {audioOnlyEnabled &&
        <div className="input-container disabled">
          <div className="label">Viewer Audio-Only URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="fanAudioUrl" value={fields.fanAudioUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.fanAudioUrl} onCopyText="Viewer Audio URL" >
            <button className="btn white copy" type="button">
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Viewer Audio URL
            </button>
          </CopyToClipboard>
        </div>
        }
        <div className="input-container disabled">
          <div className="label">Host URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="hostURL" value={fields.hostUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.hostUrl} onCopyText="Host URL" >
            <button className="btn white copy" type="button" >
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Host URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container disabled">
          <div className="label">Guest URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="celebrityUrl" value={fields.celebrityUrl} disabled />
          <CopyToClipboard text={fields.celebrityUrl} onCopyText="Guest URL" >
            <button className="btn white copy" type="button" >
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Guest URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container">
          <Label
            hint={'Redirect URL is an optional field that will redirect '
                  + 'viewers to the entered URL once the event is over'}
          >
            Redirect URL (optional)
          </Label>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" className="enabled" name="redirectUrl" value={fields.redirectUrl} onChange={handleChange} />
        </div>

        <div className="input-container">
          <Label hint="RTMP URL is an optional field that will allow you to stream to FB or Youtube">
            RTMP URL (optional)
          </Label>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" className="enabled" name="rtmpUrl" value={fields.rtmpUrl} onChange={handleChange} />
        </div>

        <div className="input-container checkbox">
          <input type="checkbox" name="archiveEvent" checked={fields.archiveEvent} onChange={handleChange} />
          <span className="label">Record Event</span>
        </div>

        {/*
        <div className="input-container checkbox">
          <input type="checkbox" name="uncomposed" checked={fields.uncomposed} onChange={handleChange} />
          <span className="label">Record Individual Streams (Uncheck for Composed Video)</span>
        </div>
        */}

        { hasAPIKey &&
          <div className="input-container submit">
            <button className="btn action green" disabled={R.isEmpty(fields.name) || this.state.submitting}>Save Event</button>
          </div>
        }
      </form>
    );
  }
}
const mapStateToProps = (state: State) => ({
  submitting: R.path(['events', 'submitting'], state),
  domainId: R.path(['settings', 'id'], state),
  user: state.currentUser,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    uploadImage: () => {
      dispatch(uploadEventImage());
    },
    uploadImageSuccess: () => {
      dispatch(uploadEventImageSuccess());
    },
    uploadCancel: () => {
      dispatch(uploadEventImageCancel());
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EventForm));
