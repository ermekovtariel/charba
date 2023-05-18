import { Button, Input, Space, Spin } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { NumericInput } from '../../Components';
import { loginAction } from '../../store/Auth/action';
import './signIn.scss';

const SignIn = () => {
  const dispatch = useDispatch();
  const [value, setValue] = useState({
    phone: '',
    password: '',
  });
  const history = useHistory();

  const handleClick = () => {
    history.push('/sign-up');
  };

  const submit = () => {
    dispatch(loginAction(value));
  };

  return (
    <>
      <div className='formProdition'>
        <Space size='middle' className='spine'>
          <Spin className='spining' size='large' />
          <span className='smile'>)</span>
        </Space>
        <div className='formValues'>
          <div>
            <span>Номер</span>
            <NumericInput
              value={value.phone}
              onChange={(e) => setValue((state) => ({ ...state, phone: e }))}
            />
          </div>
          <div>
            <span>Пароль</span>
            <Input
              type='password'
              value={value.password}
              placeholder='Пароль'
              onChange={(e) =>
                setValue((state) => ({ ...state, password: e.target.value }))
              }
            />
          </div>
        </div>
        <div className='actions'>
          <Button type='primary' onClick={submit}>
            Войти
          </Button>
          <Button type='dashed' onClick={handleClick}>
            Зарегистрироваться
          </Button>
        </div>
      </div>
    </>
  );
};
export default SignIn;
