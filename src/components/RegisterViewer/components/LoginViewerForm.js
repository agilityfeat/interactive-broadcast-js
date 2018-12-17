// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import { userForgotPassword, resetPassword, signInViewer } from '../../../actions/auth';
import { initializeBroadcast } from '../../../actions/fan';
import './LoginViewerForm.css';

/* beautify preserve:start */
type BaseProps = { auth: AuthState, currentUser: User };

type InitialProps = {
  userUrl: string,
  settings: Settings,
  error: boolean
};

type DispatchProps = {
  init: FanInitOptions => void,
  authenticateUser: (credentials: AuthCredentials) => void,
  onForgotPassword: boolean => void,
  sendResetEmail: (email: AuthCredentials) => void
 };

type Props = BaseProps & InitialProps & DispatchProps;
/* beautify preserve:end */

class LoginViewerForm extends Component {

  props: Props;
  state: {
    error: boolean,
    fields: {
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
        email: '',
        password: '',
      },
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async handleSubmit(e: SyntheticInputEvent): void {
    e.preventDefault();
    const { auth, settings, sendResetEmail, authenticateUser, userUrl } = this.props;
    const viewerData = { ...this.state.fields, domainId: settings.id, userUrl };
    try {
      auth.forgotPassword ? await sendResetEmail(viewerData) : await authenticateUser(viewerData);
    } catch (error) {
      this.setState({ error: !!error });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { settings, userUrl } = this.props;

    if (!prevProps.auth.authToken && this.props.auth.authToken) {
      this.props.init({
        domainId: settings.id,
        userType: 'fan',
        userUrl,
      });
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.value;

    this.setState({ error: false, fields: R.assoc(field, value, this.state.fields) });
  }

  render(): ReactComponent {
    const { handleSubmit, handleChange } = this;
    const { email, password } = this.state.fields;
    const { auth } = this.props;
    const submitText = auth.forgotPassword ? 'RESET PASSWORD' : 'SIGN IN';

    return (
      <form className="LoginViewerForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <Icon className="icon" name="envelope" style={{ color: 'darkgrey' }} />
          <input type="email" name="email" placeholder="Email" value={email} onChange={handleChange} />
        </div>
        { !auth.forgotPassword &&
          <div className="input-container">
            <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handleChange}
            />
          </div>
        }
        <div className="input-container">
          <input className="btn" type="submit" value={submitText} />
        </div>
        {auth.error &&
          <div className="LoginViewer-error">
            Please check your credentials and try again
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
    onForgotPassword: (forgot: boolean) => {
      dispatch(userForgotPassword(forgot));
    },
    sendResetEmail: (credentials: AuthCredentials) => {
      dispatch(resetPassword(credentials, true));
    },
  });

export default connect(mapStateToProps, mapDispatchToProps)(LoginViewerForm);
