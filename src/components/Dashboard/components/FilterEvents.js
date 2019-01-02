// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { filterBroadcastEvents } from '../../../actions/events';

type BaseProps = {
  filter: EventFilter
};
type DispatchProps = {
  setFilter: EventFilter => void
};
type Props = BaseProps & DispatchProps;

class FilterEvents extends React.Component {
  constructor(props: Props) {
    super(props);
    props.setFilter('all');
  }

  render(): ReactComponent {
    const { filter, setFilter } = this.props;
    return (
      <div className="filter-events">
        <button className={classNames('btn', { transparent: filter !== 'all' })} onClick={R.partial(setFilter, ['all'])}>
          All Events
        </button>
        <button className={classNames('btn', { transparent: filter !== 'current' })} onClick={R.partial(setFilter, ['current'])}>
          Current Events
        </button>
        <button className={classNames('btn', { transparent: filter !== 'archived' })} onClick={R.partial(setFilter, ['archived'])}>
          Archived Events
        </button>
      </div>
    );
  }
}


const mapStateToProps = (state: State): Props => R.pick(['filter'], R.prop('events', state));
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    setFilter: (filter: EventFilter) => {
      dispatch(filterBroadcastEvents(filter));
    },
  });

export default connect(mapStateToProps, mapDispatchToProps)(FilterEvents);

