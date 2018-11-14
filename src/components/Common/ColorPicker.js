// @flow
import React, { Component } from 'react';
import { SketchPicker } from 'react-color';
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
      color: '#ffffff',
      border: 'none'
    };

    this.togglePicker = this.togglePicker.bind(this);
    this.changeHandler = this.changeHandler.bind(this);
  }

  togglePicker() {
    this.setState({ showPicker: !this.state.showPicker });
  }

  changeHandler(c: Color, e: SyntheticInputEvent) {
    const rgba = `rgba(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}, ${c.rgb.a})`

    const color = c.hsl.l > 0.70 ? 'black' : 'white';
    const border = c.hsl.l > 0.70 ? '1px solid black' : 'none';
    const value = c.rgb.a < 1 ? rgba : c.hex;

    this.setState({ color, border });
    this.props.onChange(value, e);
  }

  render(): ReactComponent {
    const value = this.props.value || '#000000';
    const text = this.props.text || value;
    const buttonStyle = {
      backgroundColor: value,
      border: this.state.border,
      color: this.state.color
    };

    return (
      <div className="colorpicker">
        <button
          type="button"
          style={buttonStyle}
          className="btn action"
          onClick={this.togglePicker}
        >
          {text}
        </button>
        {
          this.state.showPicker &&
            <div className="colorpicker-container">
              <SketchPicker
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
