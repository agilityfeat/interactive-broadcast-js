// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Logout from '../Logout/Logout';
import logo from '../../images/uni-brand-wide.png';
import { listenSiteSettings } from '../../actions/settings';
import './Header.css';

type BaseProps = {
  user: CurrentUserState,
  settings: SettingsState
};

type InitialProps = {
  routes: Route[]
};

type DispatchProps = {
  listenSiteSettings: () => void
};

type Props = InitialProps & BaseProps & DispatchProps;

class Header extends React.Component {
  constructor(props: Props) {
    super(props);

    props.listenSiteSettings();
  }

  componentDidUpdate(prevProps: Props) {
    const { siteColor } = this.props.settings;
    const prevSiteColor = prevProps.settings.siteColor;

    if (prevSiteColor !== siteColor) {
      const html = document.getElementsByTagName('html')[0];
      html.style.setProperty('--main-header-bg', siteColor);
      html.style.setProperty('--main-btn-bg', siteColor);
      html.style.setProperty('--link-color', siteColor);
    }
  }

  render(): ReactComponent {
    const { routes } = this.props;
    const currentRoute = routes[routes.length - 1];

    if (currentRoute.hideHeader) return null;
    return (
      <div className="Header">
        <DefaultLogo />
        <Logout />
      </div>
    );
  }
}
const DefaultLogo = (): ReactComponent => <div className="Header-logo"><img src={logo} alt="opentok" /></div>;

const mapStateToProps = (state: State): BaseProps => ({
  user: state.currentUser,
  settings: state.settings,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    listenSiteSettings: (): void => dispatch(listenSiteSettings()),
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
