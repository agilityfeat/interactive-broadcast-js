// @flow
import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { connect } from 'react-redux';
import Favicon from 'react-favicon';
import App from './components/App/App';
import Login from './components/Login/Login';
import Loading from './components/Common/Loading';
import Dashboard from './components/Dashboard/Dashboard';
import Users from './components/Users/Users';
import Domains from './components/Domains/Domains';
import UpdateEvent from './components/UpdateEvent/UpdateEvent';
import ViewEvent from './components/ViewEvent/ViewEvent';
import Producer from './components/Broadcast/Producer/Producer';
import AdminRoutes from './components/AuthRoutes/AdminRoutes';
import CelebrityHost from './components/Broadcast/CelebrityHost/CelebrityHost';
import Fan from './components/Broadcast/Fan/Fan';
import { listenSiteSettings } from './actions/settings';

type Props = {
  settings: SettingsState,
  listenSiteSettings: () => void
};

const routes = (
  <Router history={browserHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="login" />
      <Route path="login" component={Login} />
      <Route path="/show/:domainId/:fanUrl" component={Fan} hideHeader userType={'fan'} />
      <Route path="/post-production/:adminId/:fanUrl" component={Fan} hideHeader userType={'fan'} />
      <Route path="/show-host/:domainId/:hostUrl" component={CelebrityHost} hideHeader userType={'host'} />
      <Route path="/show-guest/:domainId/:celebrityUrl" component={CelebrityHost} hideHeader userType={'celebrity'} />
      <Route path="/show/:domainId" component={Fan} hideHeader embed userType={'fan'} />
      <Route path="/show-host/:domainId" component={CelebrityHost} hideHeader embed userType={'host'} />
      <Route path="/show-guest/:domainId" component={CelebrityHost} hideHeader embed userType={'celebrity'} />
      <Route component={AdminRoutes}>
        <Route path="admin" component={Dashboard} />
        <Route path="users" component={Users} />
        <Route path="users/:adminId" component={Users} />
        <Route path="events/new" component={UpdateEvent} />
        <Route path="events/:id/edit" component={UpdateEvent} />
        <Route path="events/:id" component={Producer} />
        <Route path="events/:id/view" component={ViewEvent} />
      </Route>
    </Route>
  </Router>
);

class Routes extends React.Component {
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
    const { settings: { siteFavicon, loading } } = this.props;
    return (
      <div>
        <Favicon url={(siteFavicon && siteFavicon.url)} />
        {loading ? <Loading /> : routes}
      </div>
    );
  }
}

const mapStateToProps = (state: State): Props => ({
  settings: state.settings,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  listenSiteSettings: (): void => dispatch(listenSiteSettings()),
});


export default connect(mapStateToProps, mapDispatchToProps)(Routes);
