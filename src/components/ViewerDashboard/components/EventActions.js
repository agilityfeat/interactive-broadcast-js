// @flow
import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import Icon from 'react-fontawesome';
import { createRoutes } from '../../../services/eventUrls';

/** Event Actions */
type BaseProps = { event: BroadcastEvent };
type Props = BaseProps & DispatchProps;
const EventActions = ({ event }: Props): ReactComponent => {
  const style = (color: string): string => classNames('btn', 'action', color);
  const { id, status } = event;
  const { fanRoute } = createRoutes(event);

  const view = (): ReactComponent =>
    <Link to={fanRoute} key={`action-view-${id}`} >
      <button className={style(`${status === 'live' ? 'blue' : 'green'}`)}><Icon name="eye" /> View Event</button>
    </Link>;

  const actionButtons = (): ReactComponent[] => {
    switch (status) {
      case 'preshow':
        return [view()];
      case 'live':
        return [view()];
      default:
        return [];
    }
  };

  return (
    <div className="event-actions">
      { actionButtons() }
    </div>
  );
};

export default EventActions;
