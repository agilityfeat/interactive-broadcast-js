// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Favicon from 'react-favicon';
import Logout from '../Logout/Logout';
import logo from '../../images/uni-brand-wide.png';
import favicon from '../../images/favicon.ico';
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

type LogoProps = {
  src: string
};

type Props = InitialProps & BaseProps & DispatchProps;

const Header = (props: Props): ReactComponent => {
  const { routes, settings: { siteLogo, siteFavicon } } = props;
  const currentRoute = routes[routes.length - 1];

  if (currentRoute.hideHeader) return null;
  return (
    <div className="Header">
      <Favicon url={(siteFavicon && siteFavicon.url) || favicon} />
      <Logo src={(siteLogo && siteLogo.url) || logo} />
      <Logout />
    </div>
  );
};

const Logo = ({ src }: LogoProps): ReactComponent => <div className="Header-logo"><img src={src} alt="opentok" /></div>;

const mapStateToProps = (state: State): BaseProps => ({
  user: state.currentUser,
  settings: state.settings,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    listenSiteSettings: (): void => dispatch(listenSiteSettings()),
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
