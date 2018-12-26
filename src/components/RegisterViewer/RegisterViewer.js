// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { getEventByKey } from '../../services/api';
import { setSuccess } from '../../actions/alert';
import { setBroadcastEvent } from '../../actions/broadcast';
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
  domainId: string,
  settings: Settings,
  event: BroadcastEvent
};

type DispatchProps = {
  setEvent: (event: Event) => void,
  onSuccess: (options: AlertPartialOptions) => void,
  onForgotPassword: () => void
};

type Props = BaseProps & DispatchProps;

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

    // avoid loading other domains events domain and Id must match
    const domainId = props.domainId === props.settings.id ? props.domainId : null;
    getEventByKey(domainId, props.userUrl)
      .then((event?: BroadcastEvent): void => props.setEvent(event))
      .catch((): void => this.setState({ noEvent: true }));

    this.toggleRegister = this.toggleRegister.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
  }

  toggleRegister() {
    this.setState({ register: !this.state.register });
  }

  handleSuccess(options: AlertPartialOptions) {
    this.props.onSuccess(options);
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
        <div className="Register-header">
          <Logo src={(settings.siteLogo && settings.siteLogo.url) || logo} />
          <h3 className="Header-join">Join {eventName}</h3>
        </div>
        <div className="RegisterViewer">
          <div className="RegisterViewer-header" >
            <img src={startImage || (settings.siteLogo && settings.siteLogo.url) || logo} alt="logo" />
          </div>
          {
            register &&
            <div className="RegisterViewer-body">
              <h4>Create account for {window.location.host}</h4>
              <RegisterViewerForm userUrl={userUrl} onSuccess={this.handleSuccess} settings={settings} />
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

const mapStateToProps = (state: State): BaseProps => ({
  settings: R.prop('settings', state),
  event: R.path(['broadcast', 'event'], state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setEvent: (event: Event): void => dispatch(setBroadcastEvent(event)),
  onSuccess: (options: AlertPartialOptions): void => dispatch(setSuccess(options)),
  onForgotPassword: (forgot: boolean) => {
    dispatch(userForgotPassword(forgot));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RegisterViewer);
