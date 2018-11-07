// @flow
import React from 'react';
import ReactTooltip from 'react-tooltip';
import Icon from 'react-fontawesome';
import './Label.css';

type Props = {
  children?: ReactComponent[],
  hint?: string,
  hintPlace?: string
};

const Label = (props: Props): ReactComponent =>
  <div className="label">
    {props.hint &&
    <ReactTooltip
      place={props.hintPlace || 'right'}
      effect="solid"
      className="tooltip"
    />}
    {props.children}
    {props.hint &&
    <Icon
      data-tip={props.hint}
      className="tooltip-icon"
      name="info-circle"
    />}
  </div>;

export default Label;
