// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import shortid from 'shortid';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import firebase from '../../../services/firebase';
import './EditDomain.css';
import {
  createNewDomain,
  updateDomainRecord,
  uploadImage,
  uploadImageSuccess,
  uploadImageCancel,
} from '../../../actions/domains';
import ColorPicker from '../../Common/ColorPicker';


const emptyDomain: DomainFormData = {
  hls: true,
  httpSupport: false,
  audioOnlyEnabled: false,
  embedEnabled: false,
  registrationEnabled: false,
  fileSharingEnabled: false,
  screenSharingEnabled: false,
  siteColor: '#000000',
  otApiKey: '',
  otSecret: '',
  domain: window.location.host,
};

const formFields = [
  'hls',
  'httpSupport',
  'audioOnlyEnabled',
  'embedEnabled',
  'registrationEnabled',
  'fileSharingEnabled',
  'screenSharingEnabled',
  'siteColor',
  'siteLogo',
  'siteFavicon',
  'domain',
];

type BaseProps = {
  domain: null | Domain,
  toggleEditPanel: Unit,
  newDomain: boolean,
  errors: FormErrors
};
type DispatchProps = {
  updateDomain: DomainFormData => void,
  createDomain: DomainFormData => Promise<void>,
  uploadImage: string => void,
  uploadImageSuccess: string => void
};
type Props = BaseProps & DispatchProps;
class EditDomain extends Component {

  props: Props;
  state: {
    fields: DomainFormData,
    errors: FormErrors,
    submissionAttemped: boolean,
    showCredentials: boolean
  };
  handleChange: (string, SyntheticInputEvent) => void;
  handleColorChange: (string) => void;
  hasErrors: () => boolean;
  toggleCredentials: () => void;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: props.domain ? R.pick(formFields, props.domain) : emptyDomain,
      errors: null,
      submissionAttemped: false,
      showCredentials: false,
    };
    this.uploadFile = this.uploadFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
    this.toggleCredentials = this.toggleCredentials.bind(this);
  }

  hasErrors(): boolean {
    const domainData = this.state.fields;
    const isRequired = (field: string): boolean => field === 'displayName' || field === 'email';
    const isEmptyField = (acc: string[], field: string): string[] => R.isEmpty(domainData[field]) && isRequired(field) ? R.append(field, acc) : acc;
    const emptyFields = R.reduce(isEmptyField, [], R.keys(domainData));

    if (R.isEmpty(emptyFields)) {
      this.setState({ errors: null });
      return false;
    }
    const errors = {
      fields: R.zipObj(emptyFields, R.times((): true => true, R.length(emptyFields))),
      message: 'Fields cannot be empty',
    };
    this.setState({ errors });
    return true;
  }

  uploadFile(title: string): (e: SyntheticInputEvent) => AsyncVoid {
    return async (e: SyntheticInputEvent): AsyncVoid => {
      const field = e.target.name;
      const file = R.head(e.target.files);
      if (file) {
        this.props.uploadImage(title);
        const imageId = shortid.generate();
        const ref = firebase.storage().ref().child(`eventImages/${imageId}`);
        try {
          const snapshot: * = await ref.put(file);
          const imageData = { id: imageId, url: await snapshot.ref.getDownloadURL() };
          this.setState({ fields: R.assoc(field, imageData, this.state.fields) });
          this.props.uploadImageSuccess(title);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Error uploading image', error);
          this.props.uploadImageCancel(title);
        }
      }
    };
  }

  async handleSubmit(e: SyntheticInputEvent): AsyncVoid {
    e.preventDefault();
    this.setState({ submissionAttemped: true });
    if (this.hasErrors()) { return; }
    let domainData = R.prop('fields', this.state);
    const { newDomain, toggleEditPanel, createDomain, updateDomain } = this.props;
    const domain = R.defaultTo({}, this.props.domain);
    const initial = R.pick(formFields, domain);

    if (!R.equals(initial, domainData)) {
      if (newDomain) {
        await createDomain(R.assoc('id', shortid.generate(), domainData));
        this.setState({ fields: emptyDomain });
      } else {
        domainData = R.assoc('id', domain.id, domainData);
        domainData = !domainData.otApiKey && !domainData.otSecret ? R.omit(['otApiKKey', 'otSecret'], domainData) : domainData;
        await updateDomain(domainData);
        toggleEditPanel();
      }
    } else {
      !newDomain && toggleEditPanel();
    }
  }

  toggleCredentials() {
    this.setState({ showCredentials: !this.state.showCredentials });
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.type === 'checkbox' ? !this.state.fields[field] : e.target.value;

    this.setState({ fields: R.assoc(field, value, this.state.fields) });
    this.state.submissionAttemped && this.hasErrors();
  }

  handleColorChange(hex: string) {
    this.setState({ fields: R.assoc('siteColor', hex, this.state.fields) });
  }

  render(): ReactComponent {
    const { errors, fields } = this.state;
    const {
      hls,
      httpSupport,
      audioOnlyEnabled,
      embedEnabled,
      registrationEnabled,
      fileSharingEnabled,
      screenSharingEnabled,
      siteColor,
      domain,
      otApiKey,
      otSecret,
    } = fields;
    const { toggleEditPanel, newDomain } = this.props;
    const { handleSubmit, handleChange, handleColorChange } = this;
    const errorFields = R.propOr({}, 'fields', errors);
    const shouldShowCredentials = newDomain || this.state.showCredentials;

    return (
      <div className="EditDomain">
        <form className="EditDomain-form" onSubmit={handleSubmit}>
          <div className="edit-domain-options">
            <div className="edit-domain-bottom">
              <div className="input-container">
                <input type="checkbox" name="hls" checked={!!hls} onChange={handleChange} />
                <span className="label">Broadcast Support Enabled</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="httpSupport" checked={!!httpSupport} onChange={handleChange} />
                <span className="label">HTTP Support Enabled</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="audioOnlyEnabled" checked={!!audioOnlyEnabled} onChange={handleChange} />
                <span className="label">Share audio only URL Enabled</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="embedEnabled" checked={!!embedEnabled} onChange={handleChange} />
                <span className="label">Enable Embed</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="registrationEnabled" checked={!!registrationEnabled} onChange={handleChange} />
                <span className="label">Enable Registration</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="fileSharingEnabled" checked={!!fileSharingEnabled} onChange={handleChange} />
                <span className="label">Enable File Sharing</span>
              </div>
              <div className="input-container">
                <input type="checkbox" name="screenSharingEnabled" checked={!!screenSharingEnabled} onChange={handleChange} />
                <span className="label">Enable Screen Sharing</span>
              </div>
            </div>
            <hr />
            <div className="edit-domain-other-settings">
              <div className="input-container">
                <div className="label">Site domain:</div>
                <Icon className="icon" name="location-arrow" style={{ color: 'darkgrey', left: '95px' }} />
                <input
                  className={classNames({ error: errorFields.otApiKey })}
                  type="text"
                  name="domain"
                  value={domain}
                  placeholder="Domain"
                  onChange={handleChange}
                />
              </div>
              <div className="input-container">
                <span className="label">Site Color:</span>
                <ColorPicker value={siteColor} onChange={handleColorChange} />
              </div>
            </div>
            <div className="edit-domain-other-settings">
              <div className="input-container">
                <div className="label">Site logo:</div>
                <Icon className="icon" name="image" style={{ color: 'darkgrey', left: '74px' }} />
                <input type="file" name="siteLogo" onChange={this.uploadFile('Site Logo Upload')} />
              </div>
              <div className="input-container">
                <div className="label">Site favicon:</div>
                <Icon className="icon" name="image" style={{ color: 'darkgrey', left: '90px' }} />
                <input type="file" name="siteFavicon" onChange={this.uploadFile('Site Favicon Upload')} />
              </div>
            </div>
            <hr />
            <div className="edit-domain-other-settings">
              { !shouldShowCredentials && <button className="btn action orange" onClick={this.toggleCredentials}>Change OT credentials</button> }
              { shouldShowCredentials &&
                <div className="input-container">
                  <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
                  <input
                    className={classNames({ error: errorFields.otApiKey })}
                    type="text"
                    name="otApiKey"
                    value={otApiKey}
                    placeholder="OT API Key (optional)"
                    onChange={handleChange}
                  />
                </div>
              }
              { shouldShowCredentials &&
                <div className="input-container">
                  <Icon className="icon" name="user-secret" style={{ color: 'darkgrey' }} />
                  <input
                    className={classNames({ error: errorFields.otSecret })}
                    type="password"
                    name="otSecret"
                    value={otSecret}
                    placeholder="OT API Secret (optional)"
                    onChange={handleChange}
                    autoComplete="new-password"
                    size={42}
                  />
                </div>
              }
            </div>
            <hr />
            <div className="edit-domain-buttons">
              <input type="submit" className="btn action green" value={newDomain ? 'Create Domain' : 'Save'} />
              { !newDomain && <button className="btn action green" onClick={toggleEditPanel}>Cancel</button> }
            </div>
          </div>
        </form>
      </div>
    );
  }
}
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    updateDomain: (domainData: DomainFormData) => {
      dispatch(updateDomainRecord(domainData));
    },
    createDomain: async (domainData: DomainFormData): AsyncVoid => dispatch(createNewDomain(domainData)),
    uploadImage: (title: string): void => dispatch(uploadImage(title)),
    uploadImageSuccess: (title: string): void => dispatch(uploadImageSuccess(title)),
    uploadImageCancel: (): void => dispatch(uploadImageCancel()),
  });

export default withRouter(connect(null, mapDispatchToProps)(EditDomain));
