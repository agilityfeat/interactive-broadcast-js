// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import R from 'ramda';
import classNames from 'classnames';
import { userForgotPassword, resetPassword, signIn } from '../../actions/auth';
import LoginForm from './components/LoginForm';
import logo from '../../images/uni-brand-wide.png';
import './Login.css';

/* beautify preserve:start */
type BaseProps = { auth: AuthState, currentUser: User };
type DispatchProps = {
  authenticateUser: (credentials: AuthCredentials) => void,
  onForgotPassword: boolean => void,
  sendResetEmail: (email: AuthCredentials) => void
 };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Login extends Component {

  props: Props;

  state: {
    error: boolean
  };

  resetError: Unit;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = { error: false };
    this.resetError = this.resetError.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const { currentUser } = this.props;
    if (!currentUser.isViewer) {
      browserHistory.replace('/dashboard');
    }
  }

  handleSubmit(credentials: AuthCredentials) {
    const { sendResetEmail, authenticateUser } = this.props;
    this.props.auth.forgotPassword ? sendResetEmail(credentials) : authenticateUser(credentials);
  }

  componentDidUpdate(prevProps: Props) {
    const { currentUser } = this.props;

    if (!prevProps.currentUser && currentUser) {
      browserHistory.replace('/dashboard');
    }

    if (prevProps.currentUser && prevProps.currentUser.isViewer &&
        !currentUser.isViewer) {
      browserHistory.replace('/dashboard');
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const error = (R.path(['auth', 'error'], nextProps));
    this.setState({ error });
  }

  resetError() {
    this.setState({ error: false });
  }

  render(): ReactComponent {
    const { resetError, handleSubmit } = this;
    const { error } = this.state;
    const { onForgotPassword, settings: { siteLogo } } = this.props;
    const { forgotPassword } = this.props.auth;

    return (
      <div className="Login">
        <div className="Login-header" >
          <img src={(siteLogo && siteLogo.url) || logo} alt="opentok" />
        </div>
        <h4>Sign in to {window.location.host} as an admin</h4>
        <LoginForm onSubmit={handleSubmit} onUpdate={resetError} error={error} forgotPassword={forgotPassword} />
        <div className="Login-messages">
          { error && <div className="Login-error">Please check your credentials and try again</div> }
          <button className={classNames('Login-forgot btn transparent', { inactive: forgotPassword })} onClick={R.partial(onForgotPassword, [true])}>
            { forgotPassword ? 'Enter your email to reset your password.' : 'Forgot your password?' }
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => R.pick(['auth', 'currentUser', 'settings'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    authenticateUser: (credentials: AuthCredentials) => {
      dispatch(signIn(credentials));
    },
    onForgotPassword: (forgot: boolean) => {
      dispatch(userForgotPassword(forgot));
    },
    sendResetEmail: (credentials: AuthCredentials) => {
      dispatch(resetPassword(credentials));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Login);
