// @flow
import React from 'react';
import classNames from 'classnames';
import ActiveFanList from './ActiveFanList';
import './ProducerSidePanel.css';
import { translateRole, properCase } from '../../../../services/util';

type Props = { hidden: boolean, broadcast: BroadcastState, showGlobalChat: Unit };

const ProducerSidePanel = ({ hidden, broadcast, showGlobalChat }: Props): ReactComponent =>
  <div className={classNames('ProducerSidePanel', { hidden })} >
    <div className="ProducerSidePanel-header">
      Active {`${properCase(translateRole('fan'))}s`}&nbsp;
      ({ broadcast.activeFans.order.length })
    </div>
    <div className="PanelActions">
      <button onClick={showGlobalChat} className="PanelActions btn white">Message everyone</button>
    </div>
    <ActiveFanList activeFans={broadcast.activeFans} />
  </div>;

export default ProducerSidePanel;
