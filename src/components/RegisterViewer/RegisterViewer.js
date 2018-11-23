// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { getEventByKey } from '../../services/api';
import { setSuccess } from '../../actions/alert';
import { userForgotPassword } from '../../actions/auth';
import Loading from '../Common/Loading';
import NoEvents from '../Common/NoEvents';
import RegisterViewerForm from './components/RegisterViewerForm';
import LoginViewerForm from './components/LoginViewerForm';
import logo from '../../images/uni-brand-wide.png';
import './RegisterViewer.css';
import '../Header/Header.css';

type BaseProps = {
  userUrl: string,
  adminId: string,
  settings: Settings,
  event: BroadcastEvent
};

type DispatchProps = {
  onSuccess: (options: AlertPartialOptions) => void,
  onForgotPassword: () => void
};

type Props = BaseProps & DispatchProps;

const Logo = ({ src }: LogoProps): ReactComponent => <div className="Header-logo"><img src={src} alt="opentok" /></div>;
class RegisterViewer extends React.Component {
  state: {
    register: boolean,
    noEvent: boolean,
    event?: BroadcastEvent
  };

  toggleRegister: Unit;

  constructor(props: Props) {
    super(props);

    this.state = {
      register: false,
      event: null,
      noEvent: false,
    };

    // use the URL adminId instead of settings.id
    getEventByKey(props.adminId, props.userUrl)
      .then((event?: BroadcastEvent): void => this.setState({ event }))
      .catch((): void => this.setState({ noEvent: true }));

    this.toggleRegister = this.toggleRegister.bind(this);
    this.handleRegisterSuccess = this.handleRegisterSuccess.bind(this);
  }

  toggleRegister() {
    this.setState({ register: !this.state.register });
  }

  handleRegisterSuccess() {
    this.props.onSuccess();
    this.toggleRegister();
  }

  render(): ReactComponent {
    const { settings, userUrl } = this.props;
    const { register, noEvent, event } = this.state;
    const startImage = event && event.startImage && event.startImage.url;
    const eventName = event && event.name;

    if (noEvent) return <NoEvents />;
    if (!event) return <Loading />;

    return (
      <div>
        <div className="Header">
          <Logo src={(settings.siteLogo && settings.siteLogo.url) || logo} />
          <h3>Join {eventName}</h3>
        </div>
        <div className="RegisterViewer">
          <div className="RegisterViewer-header" >
            <img src={startImage || (settings.siteLogo && settings.siteLogo.url) || logo} alt="logo" />
          </div>
          {
            register &&
            <div className="RegisterViewer-body">
              <h4>Create account for {window.location.host}</h4>
              <RegisterViewerForm onSuccess={this.handleRegisterSuccess} settings={settings} />
              <button onClick={this.toggleRegister} className="btn transparent">
                I already have an account
              </button>
            </div>
          }
          {
            !register &&
            <div className="RegisterViewer-body">
              <h4>Sign in to {window.location.host}</h4>
              <LoginViewerForm userUrl={userUrl} settings={settings} />
              <button onClick={this.toggleRegister} className="btn transparent">
                {'I don\'t have an account'}
              </button>
              <button style={{ margin: '5px 0px' }} onClick={this.props.onForgotPassword} className="btn transparent">
                <i>I forgot my password</i>
              </button>
            </div>
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => R.pick(['settings'], state);
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onSuccess: (options: AlertPartialOptions): void => dispatch(setSuccess(options)),
  onForgotPassword: (forgot: boolean) => {
    dispatch(userForgotPassword(forgot));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RegisterViewer);
