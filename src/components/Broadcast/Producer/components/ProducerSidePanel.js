// @flow
import React from 'react';
import classNames from 'classnames';
import ActiveFanList from './ActiveFanList';
import './ProducerSidePanel.css';
import { getRoleTranslation, properCase } from '../../../../services/util';

type Props = { hidden: boolean, broadcast: BroadcastState };

const ProducerSidePanel = ({ hidden, broadcast }: Props): ReactComponent =>
  <div className={classNames('ProducerSidePanel', { hidden })} >
    <div className="ProducerSidePanel-header">
      Active {`${properCase(getRoleTranslation('fan'))}s`}&nbsp;
      ({ broadcast.activeFans.order.length })
    </div>
    <ActiveFanList activeFans={broadcast.activeFans} />
  </div>;

export default ProducerSidePanel;
