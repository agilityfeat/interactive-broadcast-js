// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import { isUserOnStage } from '../../../../services/util';
import './FanHeader.css';

type Props = {
  name: string,
  status: EventStatus,
  ableToJoin: boolean,
  showLogout: boolean,
  fanStatus: FanStatus,
  inPrivateCall: boolean,
  privateCall: PrivateCallState,
  getInLine: Unit,
  leaveLine: Unit,
  logoutUser: Unit,
  backstageConnected: boolean,
  disconnected: boolean,
  postProduction: boolean
};

const FanHeader = (props: Props): ReactComponent => {
  const handleLogout = async (): void => {
    await props.leaveLine();
    await props.logoutUser();
  };

  const {
    name,
    status,
    ableToJoin,
    getInLine,
    leaveLine,
    showLogout,
    backstageConnected,
    inPrivateCall,
    privateCall,
    fanStatus,
    disconnected,
    postProduction,
  } = props;
  const isConnecting = fanStatus === 'connecting';
  const isDisconnecting = fanStatus === 'disconnecting';
  const isOnStage = fanStatus === 'stage';
  const displayGetInLineButton = ableToJoin && status !== 'closed' && !isOnStage && !isConnecting && !isDisconnecting && !postProduction && !disconnected;
  const inPrivateCallWith = R.propOr(null, 'isWith', privateCall || {});
  const onStageUserInPrivateCall = !inPrivateCall && isOnStage && inPrivateCallWith && isUserOnStage(inPrivateCallWith);
  const getInLineButton = (): ReactComponent =>
    !backstageConnected ?
      !isConnecting && <button className="btn green getInLine" onClick={getInLine}>GET IN LINE</button> :
      <button className="btn red getInLine" onClick={leaveLine}>LEAVE LINE</button>;

  return (
    <div className="FanHeader">
      <div className="FanHeader-main">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        {showLogout && <button className="btn red getInLine" onClick={handleLogout}>LOGOUT</button>}
        { displayGetInLineButton &&
          <div>
            { getInLineButton() }
          </div>
        }
      </div>
      <div className={classNames('Fan-notice', { active: inPrivateCall || disconnected || onStageUserInPrivateCall })}>
        { inPrivateCall && 'You are in a private call with the Producer' }
        { onStageUserInPrivateCall && `The ${inPrivateCallWith} is in a private call with the producer and cannot currently hear you.` }
        { disconnected && 'Unable to establish connection, please check your network connection and refresh.' }
      </div>
    </div>
  );
};

export default FanHeader;
