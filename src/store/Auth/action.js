import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import instance from '../../utils/instance';

export const registerAction = (credentials) => async () => {
  const data = {
    email: credentials.email,
    phone: credentials.phone.split('+')[1],
    password: credentials.password,
    account: 'client',
    password_text: credentials.password,
    firstname: credentials.name,
    lastname: credentials.surname,
    age: 32,
  };

  try {
    const { data: fetchData } = await instance.post(
      `${URL_BACK}:${LOCAL_PORT_BACK}/register`,
      data
    );
    if (fetchData.accessToken) {
      localStorage.setItem('user', JSON.stringify(fetchData.user));
      localStorage.setItem('tocken', JSON.stringify(fetchData.accessToken));
      credentials.history.push('/');
      window.location.reload();
    }
  } catch (error) {
    console.log(error);
  }
};

export const loginAction = (credentials) => async () => {
  try {
    const { data: dataNumber } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/users/?phone=${
        credentials.phone.split('+')[1]
      }`
    );

    const data = {
      email: dataNumber[0].email,
      password: credentials.password,
    };

    const { data: fetchData } = await instance.post(
      `${URL_BACK}:${LOCAL_PORT_BACK}/login`,
      data
    );

    if (fetchData.accessToken) {
      localStorage.setItem('user', JSON.stringify(fetchData.user));
      localStorage.setItem('tocken', JSON.stringify(fetchData.accessToken));
      window.location.reload();
    }
  } catch (error) {
    console.log(error);
  }
};
