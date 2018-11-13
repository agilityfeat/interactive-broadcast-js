// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Logout from '../Logout/Logout';
import logo from '../../images/uni-brand-wide.png';
import './Header.css';

type BaseProps = {
  user: CurrentUserState
};

type InitialProps = {
  routes: Route[]
};

type Props = InitialProps & BaseProps;

const DefaultLogo = (): ReactComponent => <div className="Header-logo"><img src={logo} alt="opentok" /></div>;

const Header = ({ routes, user }: Props): ReactComponent => {
  const html = document.getElementsByTagName('html')[0];
  const currentRoute = routes[routes.length - 1];
  const siteColor = user && user.siteColor;

  if (siteColor) {
    html.style.setProperty('--main-background-bg', siteColor);
    html.style.setProperty('--main-btn-bg', siteColor);
    html.style.setProperty('--link-color', siteColor);
  }

  if (currentRoute.hideHeader) return null;
  return (
    <div className="Header" style={{ backgroundColor: siteColor || 'default' }}>
      <DefaultLogo />
      <Logout />
    </div>
  );
};

const mapStateToProps = (state: State): BaseProps => ({
  user: state.currentUser,
});

export default withRouter(connect(mapStateToProps, null)(Header));
