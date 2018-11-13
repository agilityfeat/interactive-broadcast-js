// @flow
import React, { Component } from 'react';
import { ChromePicker } from 'react-color';
import './ColorPicker.css';

type Color = {
  hex: string,
  rgb: {
    r: number,
    g: number,
    b: number,
    a: number
  },
  hsl: {
    h: number,
    s: number,
    l: number,
    a: number
  }
};

type Props = {
  value: string,
  text: string,
  onChange: (Color, SnytheticInputEvent) => void
};

class ColorPicker extends Component {
  constructor(props: Props) {
    super(props);

    this.state = {
      showPicker: false,
    };

    this.togglePicker = this.togglePicker.bind(this);
    this.changeHandler = this.changeHandler.bind(this);
  }

  togglePicker() {
    this.setState({ showPicker: !this.state.showPicker });
  }

  changeHandler(c: Color, e: SyntheticInputEvent) {
    this.props.onChange(c.hex, e);
    this.togglePicker();
  }

  render(): ReactComponent {
    const value = this.props.value || '#000000';
    const text = this.props.text || value;

    return (
      <div className="colorpicker">
        <button
          type="button"
          style={{ backgroundColor: value, minWidth: '90px', maxWidth: '90px' }}
          className="btn action"
          onClick={this.togglePicker}
        >
          {text}
        </button>
        {
          this.state.showPicker &&
            <div className="colorpicker-container">
              <ChromePicker
                disableAlpha
                color={value}
                onChangeComplete={this.changeHandler}
              />
            </div>
        }
      </div>
    );
  }
}

export default ColorPicker;
