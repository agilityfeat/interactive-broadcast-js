// @flow
import React from 'react';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import R from 'ramda';
import ResetPasswordForm from './components/ResetPasswordForm';
import logo from '../../images/uni-brand-wide.png';
import './ResetPassword.css';
import '../Header/Header.css';

type BaseProps = {
  userUrl: string,
  domainId: string,
  settings: Settings,
  event: BroadcastEvent
};

type DispatchProps = {
  viewerResetPassword: (token: string, password: string) => void
};

type Props = BaseProps & DispatchProps;

const ResetPassword = (props: Props): ReactComponent => {
  const { settings } = props;
  const token = props.location.query.t;

  if (!token) browserHistory.push('/');
  return (
    <div>
      <div className="ResetPassword">
        <div className="ResetPassword-header" >
          <img src={(settings.siteLogo && settings.siteLogo.url) || logo} alt="logo" />
        </div>
        <div className="ResetPassword-body">
          <h4>Reset password for {window.location.host}</h4>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State): BaseProps => R.pick(['settings'], state);
export default connect(mapStateToProps, null)(withRouter(ResetPassword));
