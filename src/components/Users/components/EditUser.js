// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import shortid from 'shortid';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import uuid from 'uuid';
import firebase from '../../../services/firebase';
import './EditUser.css';
import {
  createNewUser,
  updateUserRecord,
  uploadImage,
  uploadImageSuccess,
  uploadImageCancel,
} from '../../../actions/users';
import { getDomains } from '../../../actions/domains';
import ColorPicker from '../../Common/ColorPicker';


const emptyUser: UserFormData = {
  email: '',
  displayName: '',
  otApiKey: '',
  otSecret: '',
  hls: true,
  httpSupport: false,
  audioOnlyEnabled: false,
  embedEnabled: false,
  registrationEnabled: false,
  fileSharingEnabled: false,
  siteColor: null,
  domainId: '',
};

const formFields = [
  'email',
  'displayName',
  'hls',
  'httpSupport',
  'audioOnlyEnabled',
  'embedEnabled',
  'registrationEnabled',
  'fileSharingEnabled',
  'siteColor',
  'siteLogo',
  'siteFavicon',
  'domainId',
];

type BaseProps = {
  domains: DomainMap,
  settings: Settings
};

type InitialProps = {
  user: null | User,
  toggleEditPanel: Unit,
  newUser: boolean,
  errors: FormErrors
};

type DispatchProps = {
  updateUser: UserFormData => void,
  updateCurrentUser: UserFormData => void,
  createUser: UserFormData => Promise<void>,
  uploadImage: string => void,
  uploadImageSuccess: string => void,
  getDomains: Unit
};
type Props = InitialProps & BaseProps & DispatchProps;
class EditUser extends Component {

  props: Props;
  state: {
    fields: UserFormData,
    errors: FormErrors,
    submissionAttemped: boolean,
    showCredentials: boolean
  };
  renderDomains: () => ReactComponent;
  handleChange: (string, SyntheticInputEvent) => void;
  handleColorChange: (string) => void;
  hasErrors: () => boolean;
  toggleCredentials: () => void;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: props.user ? R.pick(formFields, props.user) : emptyUser,
      errors: null,
      submissionAttemped: false,
      showCredentials: false,
    };
    props.getDomains();
    this.uploadFile = this.uploadFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
    this.toggleCredentials = this.toggleCredentials.bind(this);
    this.renderDomains = this.renderDomains.bind(this);
  }

  renderDomains(): ReactComponent {
    const errorFields = R.propOr({}, 'fields', this.state.errors);
    const { domains, settings } = this.props;
    const { domainId } = this.state.fields;

    return (
      <div className="input-container">
        <span className="label">Select a Domain:</span>&nbsp;
        <select
          className={classNames({ error: errorFields.otApiKey })}
          name="domainId"
          placeholder="Domain"
          value={domainId || settings.id}
          onChange={this.handleChange}
        >
          {
            Object.keys(domains).map((k: string): [ReactComponent] =>
              <option key={k} value={k}>{domains[k].domain}</option>)
          }
        </select>
      </div>
    );
  }

  hasErrors(): boolean {
    const userData = this.state.fields;
    const isRequired = (field: string): boolean => field === 'displayName' || field === 'email';
    const isEmptyField = (acc: string[], field: string): string[] => R.isEmpty(userData[field]) && isRequired(field) ? R.append(field, acc) : acc;
    const emptyFields = R.reduce(isEmptyField, [], R.keys(userData));

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
          const imageData = { id: imageId, url: snapshot.downloadURL };
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
    let userData = R.prop('fields', this.state);
    const { newUser, toggleEditPanel, createUser, updateUser } = this.props;
    const user = R.defaultTo({}, this.props.user);
    const initial = R.pick(formFields, user);

    if (!R.equals(initial, userData)) {
      if (newUser) {
        await createUser(R.assoc('password', uuid(), userData));
        this.setState({ fields: emptyUser });
      } else {
        userData = R.assoc('id', user.id, userData);
        userData = !userData.otApiKey && !userData.otSecret ? R.omit(['otApiKKey', 'otSecret'], userData) : userData;
        await updateUser(userData);
        toggleEditPanel();
      }
    } else {
      !newUser && toggleEditPanel();
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
    const { errors, fields, showCredentials } = this.state;
    const {
      email,
      displayName,
      otApiKey,
      otSecret,
      hls,
      httpSupport,
      audioOnlyEnabled,
      embedEnabled,
      registrationEnabled,
      fileSharingEnabled,
      siteColor,
    } = fields;
    const { toggleEditPanel, newUser } = this.props;
    const { handleSubmit, handleChange, handleColorChange } = this;
    const errorFields = R.propOr({}, 'fields', errors);
    const shouldShowCredentials = newUser || showCredentials;

    return (
      <div className="EditUser">
        <form className="EditUser-form" onSubmit={handleSubmit}>
          <div className="edit-user-top">
            <div className="input-container">
              <Icon className="icon" name="envelope" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.email })}
                type="email"
                value={email}
                name="email"
                onChange={handleChange}
                placeholder="Email"
                disabled={!newUser}
              />
            </div>
            <div className="input-container">
              <Icon className="icon" name="user" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.displayName })}
                type="text"
                value={displayName}
                name="displayName"
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
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
          <div className="edit-user-options">
            <div className="edit-user-bottom">
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
            </div>
            <hr />
            <div className="edit-user-other-settings">
              {this.renderDomains()}
              <div className="input-container">
                <span className="label">Choose Admin Color:</span>
                <ColorPicker value={siteColor} onChange={handleColorChange} />
              </div>
              <div className="input-container">
                <div className="label">Site logo:</div>
                <Icon className="icon" name="image" style={{ color: 'darkgrey', left: '74px' }} />
                <input type="file" name="siteLogo" onChange={this.uploadFile('Site Logo Upload')} />
              </div>
            </div>
            <div className="edit-user-other-settings">
              <div className="input-container">
                <div className="label">Site favicon:</div>
                <Icon className="icon" name="image" style={{ color: 'darkgrey', left: '90px' }} />
                <input type="file" name="siteFavicon" onChange={this.uploadFile('Site Favicon Upload')} />
              </div>
            </div>
            <hr />
            <div className="edit-user-buttons">
              <input type="submit" className="btn action green" value={newUser ? 'Create User' : 'Save'} />
              { !newUser && <button className="btn action green" onClick={toggleEditPanel}>Cancel</button> }
            </div>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<BaseProps> = (state: State): BaseProps => ({
  domains: state.domains,
  settings: state.settings,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    updateUser: (userData: UserFormData) => {
      dispatch(updateUserRecord(userData));
    },
    getDomains: async (): AsyncVoid => dispatch(getDomains()),
    createUser: async (userData: UserFormData): AsyncVoid => dispatch(createNewUser(userData)),
    uploadImage: (title: string): void => dispatch(uploadImage(title)),
    uploadImageSuccess: (title: string): void => dispatch(uploadImageSuccess(title)),
    uploadImageCancel: (): void => dispatch(uploadImageCancel()),
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditUser));
