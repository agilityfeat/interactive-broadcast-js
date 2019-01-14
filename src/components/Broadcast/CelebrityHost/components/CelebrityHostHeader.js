// @flow
import React from 'react';
import classNames from 'classnames';
import R from 'ramda';
import { isUserOnStage, translateRole } from '../../../../services/util';
import './CelebrityHostHeader.css';

type Props = {
  userType: 'host' | 'celebrity',
  name: string,
  status: EventStatus,
  disconnected: boolean,
  privateCall: PrivateCallState // eslint-disable-line react/no-unused-prop-types
};
const CelebrityHostHeader = (props: Props): ReactComponent => {
  const { userType, name, status, disconnected } = props;
  const privateCallWith = R.path(['privateCall', 'isWith'], props);
  const inPrivateCall = R.equals(userType, privateCallWith);
  const otherInPrivateCall = !inPrivateCall && isUserOnStage(privateCallWith);
  return (
    <div className="CelebrityHostHeader">
      <div className="CelebrityHostHeader-main">
        <div>
          <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        </div>
        <div className="user-role">
          {translateRole(userType)}
        </div>
      </div>
      <div className={classNames('CelebrityHostHeader-notice', { active: (inPrivateCall || otherInPrivateCall || disconnected) })}>
        { inPrivateCall && 'You are in a private call with the Producer' }
        { otherInPrivateCall && `The ${privateCallWith} is in a private call with the producer and cannot currently hear you.` }
        { disconnected && 'Unable to establish connection, please check your network connection and refresh.' }
      </div>
    </div>
  );
};

export default CelebrityHostHeader;
