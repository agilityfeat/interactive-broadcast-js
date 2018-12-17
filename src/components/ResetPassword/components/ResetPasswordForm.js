// @flow
import React, { Component } from 'react';
import R from 'ramda';
import Icon from 'react-fontawesome';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { viewerResetPassword } from '../../../actions/auth';
import './ResetPasswordForm.css';

/* beautify preserve:start */
type BaseProps = { token: string };

type InitialProps = { settings: Settings };

type DispatchProps = {
  resetPassword: (token: string, password: string) => void
};

type Props = BaseProps & InitialProps & DispatchProps;

/* beautify preserve:end */

class ResetPasswordForm extends Component {

  props: Props;
  state: {
    error: boolean,
    fields: {
      password: string
    }
  }
  handleSubmit: Unit;
  handleChange: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      error: false,
      fields: {
        password: '',
      },
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async handleSubmit(e: SyntheticInputEvent): void {
    e.preventDefault();

    try {
      const { resetPassword, token, settings } = this.props;
      const { userUrl } = await resetPassword({ token, ...this.state.fields });

      browserHistory.push(`/show/${settings.id}/${userUrl}`);
    } catch (error) {
      this.setState({ error: !!error });
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.value;

    this.setState({ error: false, fields: R.assoc(field, value, this.state.fields) });
  }


  render(): ReactComponent {
    const { handleSubmit, handleChange } = this;
    const { error } = this.props;
    const { password } = this.state.fields;

    return (
      <form className="ResetPasswordForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
          <input
            className={classNames({ error })}
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
          />
        </div>
        <div className="input-container">
          <input className="btn" type="submit" value="Reset password" />
        </div>
        {this.state.error &&
          <div className="ResetPassword-error">
            There was an error reseting your password
          </div>
        }
      </form>
    );
  }
}

const mapStateToProps = (state: State): InitialProps => R.pick(['settings'], state);
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  resetPassword: (data: resetCredentials): AsyncVoid => dispatch(viewerResetPassword(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ResetPasswordForm);
