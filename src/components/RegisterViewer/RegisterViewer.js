// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { setSuccess } from '../../actions/alert';
import { userForgotPassword } from '../../actions/auth';
import RegisterViewerForm from './components/RegisterViewerForm';
import LoginViewerForm from './components/LoginViewerForm';
import logo from '../../images/uni-brand-wide.png';
import './RegisterViewer.css';
import '../Header/Header.css';

type BaseProps = {
  userUrl: string,
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
    register: boolean
  };

  toggleRegister: Unit;

  constructor(props: Props) {
    super(props);

    this.state = {
      register: false,
    };

    this.toggleRegister = this.toggleRegister.bind(this);
  }

  toggleRegister() {
    this.setState({ register: !this.state.register });
  }

  render(): ReactComponent {
    const { settings, onSuccess, userUrl } = this.props;
    const { register } = this.state;

    return (
      <div>
        <div className="Header">
          <Logo src={(settings.siteLogo && settings.siteLogo.url) || logo} />
        </div>
        <div className="RegisterViewer">
          <div className="RegisterViewer-header" >
            <img src={(settings.siteLogo && settings.siteLogo.url) || logo} alt="logo" />
          </div>
          {
            register &&
            <div className="RegisterViewer-body">
              <RegisterViewerForm onSuccess={onSuccess} settings={settings} />
              <button onClick={this.toggleRegister} className="btn transparent">
                I already have an account
              </button>
            </div>
          }
          {
            !register &&
            <div className="RegisterViewer-body">
              <LoginViewerForm userUrl={userUrl} onSuccess={onSuccess} settings={settings} />
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
