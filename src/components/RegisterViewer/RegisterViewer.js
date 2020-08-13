// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { browserHistory } from 'react-router';
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
  eventMode: boolean,
  currentUser: User,
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
    props.eventMode && getEventByKey(domainId, props.userUrl)
      .then((event?: BroadcastEvent): void => props.setEvent(event))
      .catch((): void => this.setState({ noEvent: true }));

    this.toggleRegister = this.toggleRegister.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
  }

  // this wont trigger in Fan view since we don't allow
  // the component to render if a user exists
  componentDidMount() {
    const { currentUser, settings } = this.props;

    if (!settings.registrationEnabled || currentUser) {
      browserHistory.replace('/admin');
    }
  }

  toggleRegister() {
    this.setState({ register: !this.state.register });
  }

  handleSuccess(options: AlertPartialOptions) {
    this.props.onSuccess(options);
  }

  render(): ReactComponent {
    const { eventMode, settings, userUrl, event } = this.props;
    const { register, noEvent } = this.state;
    const startImage = event && event.startImage && event.startImage.url;

    if (eventMode) {
      if (noEvent) return <NoEvents />;
      if (!event) return <Loading />;
    }

    return (
      <div className="RegisterViewerWrapper">
        <div className="RegisterViewer">
          <div className="RegisterViewer-header" >
            <h4>Welcome</h4>
          </div>
          <div className="RegisterViewer-body">
            <p><strong>Welcome to PreventionLink of Southern Maryland’s Telehealth National Diabetes Prevention Program (NDPP).</strong></p>
            <p>
              The NDPP is sponsored by the Centers for Disease Control and Prevention (CDC),
              and consists of 26 online or real-time classes led by trained lifestyle coaches.
              The lifestyle coaches will provide information and resources to help you eat healthy,
              add physical activity to your routine, manage stress, stay motivated and solve
              problems to reach your goals. A trained lifestyle coach will lead the classes and
              include activities that will make it fun.
            </p>
            <p>
              Research shows the program prevents or delays type 2 diabetes and lowers your risk
              of heart attack or stroke. Your primary care provider and your lifestyle coach will
              work with you to start and finish all of the sessions.
            </p>
            <p><strong>Welcome, and all the best!</strong></p>
          </div>
        </div>
        <div className="RegisterViewer">
          <div className="RegisterViewer-header" >
            <img src={startImage || (settings.siteLogo && settings.siteLogo.url) || logo} alt="logo" />
          </div>
          {
            register &&
            <div className="RegisterViewer-body">
              <h4>Create an account</h4>
              <RegisterViewerForm eventMode={eventMode} userUrl={userUrl} onSuccess={this.handleSuccess} />
              <button onClick={this.toggleRegister} className="btn transparent">
                I already have an account
              </button>
            </div>
          }
          {
            !register &&
            <div className="RegisterViewer-body">
              <h4>Sign in</h4>
              <LoginViewerForm eventMode={eventMode} userUrl={userUrl} />
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
  currentUser: R.prop('currentUser', state),
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
