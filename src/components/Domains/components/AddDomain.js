// @flow
import React from 'react';
import Icon from 'react-fontawesome';
import EditDomain from './EditDomain';
import './AddDomain.css';


const AddDomain = (): ReactComponent =>
  <div className="AddDomain admin-page-list-item">
    <div className="header-container">
      <Icon name="domain" size="lg" style={{ color: '#607d8b' }} />
      <h4>Create New Domain</h4>
    </div>
    <EditDomain domain={null} newDomain />
  </div>;

export default AddDomain;
