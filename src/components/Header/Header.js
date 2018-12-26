// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
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

type LogoProps = {
  src: string
};

type Props = InitialProps & BaseProps & DispatchProps;
type ItemProps = {
  to: string,
  path: string,
  title: string
};

const HeaderItem = (props: ItemProps): ReactComponent => (
  <Link className={`Header-item ${props.to.includes(props.path) && 'active'}`} to={props.to}>
    {props.title}
  </Link>
);

const Header = (props: Props): ReactComponent => {
  const { user, routes, settings: { siteLogo }, event } = props;
  const currentRoute = routes[routes.length - 1];

  if (currentRoute.hideHeader) return null;
  return (
    <div className="Header">
      <div className="Header-right">
        <Logo src={(siteLogo && siteLogo.url) || logo} />
        {(event && !user) && <h3>Join {event.name}</h3>}
      </div>
      <div className="Header-left">
        {user && <HeaderItem to="/files" path={currentRoute.path} title="Files" />}
        <Logout />
      </div>
    </div>
  );
};

const Logo = ({ src }: LogoProps): ReactComponent => <div className="Header-logo"><img src={src} alt="opentok" /></div>;

const mapStateToProps = (state: State): BaseProps => ({
  user: state.currentUser,
  settings: state.settings,
  event: state.broadcast.event,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    listenSiteSettings: (): void => dispatch(listenSiteSettings()),
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
