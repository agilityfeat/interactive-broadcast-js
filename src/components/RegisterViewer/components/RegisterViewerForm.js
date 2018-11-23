// @flow
import React, { Component } from 'react';
import R from 'ramda';
import Icon from 'react-fontawesome';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { createViewer } from '../../../services/api';
import { signInViewer } from '../../../actions/auth';
import { initializeBroadcast } from '../../../actions/fan';
import './RegisterViewerForm.css';

/* beautify preserve:start */
type BaseProps = { auth: AuthState, currentUser: User };

type InitialProps = {
  settings: Settings,
  error: boolean,
  onSuccess: (options: AlertPartialOptions) => void
};

type DispatchProps = {
  init: FanInitOptions => void,
  authenticateUser: (credentials: AuthCredentials) => void
 };

type Props = BaseProps & InitialProps & DispatchProps;

/* beautify preserve:end */

class RegisterViewerForm extends Component {

  props: Props;
  state: {
    error: boolean,
    fields: {
      displayName: string,
      email: string,
      password: string
    }
  }
  handleSubmit: Unit;
  handleChange: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      error: false,
      fields: {
        displayName: '',
        email: '',
        password: '',
      },
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async handleSubmit(e: SyntheticInputEvent): void {
    e.preventDefault();
    const { settings, onSuccess, authenticateUser, userUrl } = this.props;
    const viewerData = { ...this.state.fields, adminId: settings.id, userUrl };

    try {
      await createViewer(settings.id, viewerData);
      onSuccess({ text: 'User created successfully' });
      await authenticateUser(viewerData);
      this.setState({
        error: false,
        fields: {
          displayName: '',
          email: '',
          password: '',
        },
      });
    } catch (error) {
      this.setState({ error: !!error });
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.value;

    this.setState({ error: false, fields: R.assoc(field, value, this.state.fields) });
  }

  componentDidUpdate(prevProps: Props) {
    const { settings, userUrl } = this.props;

    if (!prevProps.auth.token && this.props.auth.authToken) {
      this.props.init({
        adminId: settings.id,
        userType: 'fan',
        userUrl,
      });
    }
  }

  render(): ReactComponent {
    const { handleSubmit, handleChange } = this;
    const { error } = this.props;
    const { email, password, displayName } = this.state.fields;

    return (
      <form className="RegisterViewerForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <Icon className="icon" name="envelope" style={{ color: 'darkgrey' }} />
          <input className={classNames({ error })} type="email" name="email" placeholder="Email" value={email} onChange={handleChange} />
        </div>
        <div className="input-container">
          <Icon className="icon" name="pencil" style={{ color: 'darkgrey' }} />
          <input className={classNames({ error })} type="text" name="displayName" placeholder="Name" value={displayName} onChange={handleChange} />
        </div>
        <div className="input-container">
          <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
          <input
            className={classNames({ error })}
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
          />
        </div>
        <div className="input-container">
          <input className="btn" type="submit" value="Register" />
        </div>
        {this.state.error &&
          <div className="RegisterViewer-error">
            There was an error registering
          </div>
        }
      </form>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => ({
  ...R.pick(['auth', 'currentUser', 'settings'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    init: (options: FanInitOptions): void => dispatch(initializeBroadcast(options)),
    authenticateUser: (credentials: AuthCredentials) => {
      dispatch(signInViewer(credentials));
    },
  });

export default connect(mapStateToProps, mapDispatchToProps)(RegisterViewerForm);
