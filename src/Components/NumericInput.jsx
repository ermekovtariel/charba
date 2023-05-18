import { Input } from 'antd';
import React from 'react';

const NumericInput = (props) => {
  const { onChange } = props;
  const handleChange = (e) => {
    const { value: inputValue } = e.target;
    const reg = /^-?\d*(\+\d*)?$/;

    if (reg.test(inputValue) || inputValue === '' || inputValue === '-') {
      onChange(inputValue);
    }
  };

  return (
    <Input
      {...props}
      onChange={handleChange}
      placeholder='0709166112'
      maxLength={16}
    />
  );
};

export default NumericInput;
