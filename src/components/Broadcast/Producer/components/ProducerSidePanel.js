// @flow
import React from 'react';
import classNames from 'classnames';
import ActiveFanList from './ActiveFanList';
import './ProducerSidePanel.css';
import { translateRole, properCase } from '../../../../services/util';

// #region Type Definitions
type Props = {
  hidden: boolean,
  broadcast: BroadcastState,
  showUniversalChat: Unit
};
// #endregion

const ProducerSidePanel = ({ hidden, broadcast, showUniversalChat }: Props): ReactComponent =>
  <div className={classNames('ProducerSidePanel', { hidden })} >
    <div className="ProducerSidePanel-header">
      Active {`${properCase(translateRole('fan'))}s`}&nbsp;
      ({ broadcast.activeFans.order.length })
    </div>
    <div className="PanelActions">
      <button onClick={showUniversalChat} className="PanelActions btn white">Message Everyone</button>
    </div>
    <ActiveFanList activeFans={broadcast.activeFans} />
  </div>;

export default ProducerSidePanel;
