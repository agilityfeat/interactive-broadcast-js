// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import DomainActions from './DomainActions';
import EditDomain from './EditDomain';
import AddDomain from './AddDomain';
import { deleteDomain } from '../../../actions/domains';
import './DomainList.css';

type ListItemProps = { domain: Domain };
class DomainListItem extends Component {
  props: ListItemProps;
  state: { editingDomain: false };
  toggleEditPanel: Unit;

  constructor(props: ListItemProps) {
    super(props);
    this.state = { editingDomain: false };
    this.toggleEditPanel = this.toggleEditPanel.bind(this);
  }

  toggleEditPanel() {
    this.setState({ editingDomain: !this.state.editingDomain });
  }

  render(): ReactComponent {
    const { domain } = this.props;
    const { editingDomain } = this.state;
    const { toggleEditPanel } = this;
    return (
      <div>
        <div className="DomainList-item admin-page-list-item" key={domain.id}>
          { !editingDomain &&
            <div className="domain-info">
              <span className="name">{domain.domain}</span>
            </div>
          }
          { editingDomain ?
            <EditDomain domain={domain} toggleEditPanel={toggleEditPanel} /> :
            <DomainActions domain={domain} toggleEditPanel={toggleEditPanel} />
          }
        </div>
      </div>
    );
  }
}

type BaseProps = { domains: Domain[], currentUser: User };
type DispatchProps = { delete: DomainId => void };
type InitialProps = { adminId: string };
type Props = BaseProps & DispatchProps & InitialProps;
const renderDomain = (domain: Domain, adminId: string): ReactComponent =>
  <DomainListItem key={domain.id} domain={domain} adminId={adminId} />;
const DomainList = ({ domains, adminId, currentUser }: Props): ReactComponent =>
  <ul className="DomainList admin-page-list">
    {
      !adminId && R.ifElse(
        R.isEmpty,
        (): null => null,
        R.map(renderDomain) // eslint-disable-line comma-dangle
      )(R.values(domains))
    }
    { adminId && renderDomain(currentUser, adminId) }
    { !adminId && <AddDomain /> }
  </ul>;


const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  domains: R.path(['domains'], state),
  adminId: R.path(['params', 'adminId'], ownProps),
  currentUser: R.path(['currentUser'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    delete: (domainId: DomainId) => {
      dispatch(deleteDomain(domainId));
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DomainList));
