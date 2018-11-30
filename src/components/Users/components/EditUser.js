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


const emptyUser: UserFormData = {
  email: '',
  displayName: '',
  domainId: '',
};

const formFields = [
  'email',
  'displayName',
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
  };
  renderDomains: () => ReactComponent;
  handleChange: (string, SyntheticInputEvent) => void;
  hasErrors: () => boolean;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: props.user ? R.pick(formFields, props.user) : emptyUser,
      errors: null,
      submissionAttemped: false,
    };
    props.getDomains();
    this.uploadFile = this.uploadFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
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
        await updateUser(userData);
        toggleEditPanel();
      }
    } else {
      !newUser && toggleEditPanel();
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.type === 'checkbox' ? !this.state.fields[field] : e.target.value;

    this.setState({ fields: R.assoc(field, value, this.state.fields) });
    this.state.submissionAttemped && this.hasErrors();
  }

  render(): ReactComponent {
    const { errors, fields } = this.state;
    const {
      email,
      displayName,
      // otApiKey,
      // otSecret,
      // hls,
      // httpSupport,
      // audioOnlyEnabled,
      // embedEnabled,
      // registrationEnabled,
      // fileSharingEnabled,
      // siteColor,
    } = fields;
    const { toggleEditPanel, newUser } = this.props;
    const { handleSubmit, handleChange } = this;
    const errorFields = R.propOr({}, 'fields', errors);

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
          </div>
          <hr />
          <div className="edit-user-options">
            <div className="edit-user-other-settings">
              {this.renderDomains()}
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
