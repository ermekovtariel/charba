import { Button, Input, Space, Spin } from 'antd';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { NumericInput } from '../../Components';
import './signup.scss';
import { registerAction } from '../../store/Auth/action';
import { useDispatch } from 'react-redux';

const SignUp = () => {
  const dispatch = useDispatch();
  const [value, setValue] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    surname: '',
  });
  const history = useHistory();

  function handleClick() {
    history.push('/');
  }

  const submit = () => {
    dispatch(registerAction({ ...value, history }));
  };

  return (
    <>
      <div className='formProdition'>
        <Space size='middle' className='spine'>
          <Spin className='spining' size='large' />
          <span className='smile'>)</span>
        </Space>
        <div className='formValues'>
          <div className='fio'>
            <div>
              <span>Имя</span>
              <Input
                type='text'
                value={value.name}
                placeholder='Имя'
                onChange={(e) =>
                  setValue((state) => ({ ...state, name: e.target.value }))
                }
              />
            </div>
            <div>
              <span>Фамилия</span>
              <Input
                type='text'
                value={value.surname}
                placeholder='Фамилия'
                onChange={(e) =>
                  setValue((state) => ({ ...state, surname: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <span>Электронная почта</span>
            <Input
              // type='password'
              type='text'
              value={value.email}
              placeholder='e-mail'
              onChange={(e) =>
                setValue((state) => ({ ...state, email: e.target.value }))
              }
            />
          </div>
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
              // type='password'
              type='text'
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
            Зарегистрироваться
          </Button>
          <Button type='dashed' onClick={handleClick}>
            Уже есть аккаунт? Войти
          </Button>
        </div>
      </div>
    </>
  );
};
export default SignUp;
