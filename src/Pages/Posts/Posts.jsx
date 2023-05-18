/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Drawer, InputNumber, Select, Switch, Table } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile, userLS } from '../../Configs/halpers';

import { account } from '../../Configs/utils';
import instance from '../../utils/instance';
import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import { isEmpty } from 'ramda';
import { fetchPosts } from '../../store/Posts/action';

const Posts = () => {
  const dispatch = useDispatch();
  const { productsItems, states } = useSelector((store) => store.postPage);
  const [data, setdata] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [dreawerForm, setDreawerForm] = useState({
    value: 1,
  });

  useEffect(() => {
    dispatch(fetchPosts());
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts`
        );
        if (account === 'root') {
          setdata(
            data.map((item) => ({
              ...item,
              certificate: {
                id: item.id,
                product_id: item.product_id,
                certificate: item.certificate,
              },
              delete: {
                id: item.id,
                product_id: item.product_id,
                certificate: item.certificate,
                value: item.value,
              },
            }))
          );
        } else {
          setdata(
            data
              .filter(({ user_id }) => user_id === userLS.id)
              .map((item) => ({
                ...item,
                delete: {
                  id: item.id,
                  product_id: item.product_id,
                  certificate: item.certificate,
                },
              }))
          );
        }
      } catch (error) {
        console.log(error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const showDrawer = () => {
    setIsOpen(true);
  };
  const onClose = () => {
    setIsOpen(false);
  };
  const onCreate = async () => {
    try {
      const newProduct = {
        user_id: userLS?.id,
        states_id: dreawerForm.state.id,
        states_title: dreawerForm.state.title,
        product_id: dreawerForm.product.id,
        product: dreawerForm.product.product,
        number: `+${userLS.phone}`,
        certificate: 0,
        value: dreawerForm.value,
      };
      const { data } = await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts`,
        newProduct
      );
      if (account === 'root') {
        const stateProduct = {
          ...data,
          certificate: {
            id: data.id,
            product_id: data.product_id,
            certificate: data.certificate,
          },
          delete: {
            id: data.id,
            product_id: data.product_id,
            certificate: data.certificate,
            value: data.value,
          },
        };
        setdata((state) => [...state, stateProduct]);
      } else {
        const stateProduct = {
          ...data,
          delete: {
            id: data.id,
            product_id: data.product_id,
            certificate: data.certificate,
            value: data.value,
          },
        };
        setdata((state) => [...state, stateProduct]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onSwitch = async ({ certificate, id, product_id }) => {
    const card = data.find((item) => item.id === id);

    if (certificate) {
      try {
        await instance.patch(
          `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${id}`,
          {
            user_id: card.user_id,
            states_id: card.states_id,
            states_title: card.states_title,
            product_id: card.product_id,
            product: card.product,
            certificate: 0,
            value: card.value,
            id: card.id,
          }
        );
        setdata((state) => {
          return state.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                certificate: {
                  ...item.certificate,
                  certificate: 0,
                },
              };
            }
            return item;
          });
        });
        const { data: object } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/?product_id=${product_id}`
        );
        const newObj = {
          ...object[0],
          value: object[0].value - card.value,
        };
        await instance.patch(
          `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${object[0].id}`,
          newObj
        );
      } catch (error) {
        console.log(error);
      }
      return;
    }

    await instance.patch(`${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${id}`, {
      user_id: card.user_id,
      states_id: card.states_id,
      states_title: card.states_title,
      product_id: card.product_id,
      product: card.product,
      certificate: 1,
      value: card.value,
      id: card.id,
    });
    setdata((state) => {
      return state.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            certificate: {
              ...item.certificate,
              certificate: 1,
            },
          };
        }
        return item;
      });
    });
    const { data: stateData } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/?product_id=${card.product_id}`
    );

    if (isEmpty(stateData)) {
      const newObj = {
        product: card.product,
        value: card.value,
        product_id: card.product_id,
      };
      await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}`,
        newObj
      );
      return;
    }
    const newObj = {
      value: data[0].value + card.value,
      product: card.product,
      product_id: card.product_id,
    };
    await instance.patch(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${stateData[0].id}`,
      newObj
    );
  };

  const onDelete = async ({ certificate, id, product_id }) => {
    const card = data.find((item) => item.id === id);
    try {
      if (certificate) {
        const { data: object } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/?product_id=${product_id}`
        );
        const newObj = {
          ...object[0],
          value: object[0].value - card.value,
        };
        if (newObj.value === 0) {
          await instance.delete(
            `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${object[0].id}`
          );
          setdata((state) =>
            state.filter((item) => {
              console.log(item);
              return item.id !== id;
            })
          );
        } else {
          await instance.patch(
            `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${object[0].id}`,
            newObj
          );
          setdata((state) =>
            state.filter((item) => {
              console.log(item);
              return item.id !== id;
            })
          );
        }
      }
      setdata((state) =>
        state.filter((item) => {
          console.log(item);
          return item.id !== id;
        })
      );
      await instance.delete(
        `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${id}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  const columns = [
    {
      key: 'product',
      title: 'Продукт',
      dataIndex: 'product',
    },
    {
      key: 'number',
      title: 'Номер',
      dataIndex: 'number',
      render: (value) => <a href={`tel:${value}`}>{value}</a>,
    },
    {
      key: 'certificate',
      title: 'Сертификация',
      dataIndex: 'certificate',
      render:
        account === 'root'
          ? ({ certificate, id, product_id }) => (
              <Switch
                checkedChildren={<CheckOutlined />}
                unCheckedChildren={<CloseOutlined />}
                onClick={() => onSwitch({ certificate, id, product_id })}
                // defaultChecked={certificate}
                checked={certificate}
              />
            )
          : (item) => (item ? <CheckOutlined /> : <CloseOutlined />),
    },
    {
      key: 'states_title',
      title: 'Область',
      dataIndex: 'states_title',
    },
    {
      key: 'value',
      title: 'Посажено',
      dataIndex: 'value',
    },
    {
      key: 'delete',
      title: '',
      dataIndex: 'delete',
      render: ({ certificate, id, product_id }) => (
        <Button
          onClick={() => onDelete({ certificate, id, product_id })}
          type='link'
        >
          Удалить
        </Button>
      ),
    },
  ];

  const handleChange = (type, e) => {
    if (type === 'inputNumber') {
      const reg = /^-?\d*(\+\d*)?$/;
      if (reg.test(e) || e === '' || e === '-') {
        if (Number(e) <= 300) {
          setDreawerForm((state) => ({ ...state, value: Number(e) }));
        }
      }
    }
    if (type === 'product') {
      const item = productsItems.find(({ id }) => id === e);
      setDreawerForm((state) => ({ ...state, product: item }));
    }
    if (type === 'state') {
      const item = states.find(({ id }) => id === e);
      setDreawerForm((state) => ({ ...state, state: item }));
    }
  };

  const createButtonDisabled = useMemo(
    () => !(dreawerForm.product && dreawerForm.state),
    [dreawerForm]
  );

  return (
    <>
      <div>
        <div
          style={{
            display: 'flex',
            gridGap: '1rem',
          }}
        >
          <Button
            size='large'
            type='primary'
            onClick={showDrawer}
            disabled={false}
            icon={<PlusOutlined />}
          >
            Добавить новый участок с посевом
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => {
              console.log('awd');
            }}
            // icon={<PlusOutlined />}
          >
            Открыть кабинет для проверки
          </Button>
        </div>
        <div
          style={{
            marginTop: '1rem',
            width: '100%',
            overflowX: 'scroll',
          }}
        >
          <Table
            columns={columns}
            scroll={true}
            loading={isLoading}
            dataSource={data}
          />
        </div>
      </div>

      <Drawer
        title='Добавление нового участка с посевомом'
        width={isMobile ? '100%' : 425}
        onClose={onClose}
        open={isOpen}
      >
        <div
          style={{
            display: 'grid',
            gridGap: '1rem',
          }}
        >
          <InputNumber
            min={1}
            max={300}
            size='large'
            onChange={(e) => handleChange('inputNumber', e)}
            addonAfter='Гектар'
            defaultValue={dreawerForm.value}
            value={dreawerForm.value}
            status={dreawerForm.value > 300 ? 'error' : undefined}
            prefix={
              dreawerForm.value > 300 ? (
                <ExclamationCircleOutlined />
              ) : undefined
            }
          />
          <Select
            size='large'
            defaultValue={dreawerForm.product_id}
            value={dreawerForm.product_id}
            style={{ width: '100%' }}
            placeholder='Выберите продукт'
            showSearch
            optionFilterProp='children'
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              ((optionA?.label).toLowerCase() ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            onChange={(e) => handleChange('product', e)}
            options={[
              ...productsItems.map(({ id, product }) => ({
                value: id,
                label: product,
              })),
            ]}
          />
          <Select
            size='large'
            style={{ width: '100%' }}
            value={dreawerForm.states_id}
            defaultValue={dreawerForm.states_id}
            placeholder='Выберите область'
            showSearch
            optionFilterProp='children'
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              ((optionA?.label).toLowerCase() ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            onChange={(e) => handleChange('state', e)}
            options={[
              ...states.map(({ id, title }) => ({
                value: id,
                label: title,
              })),
            ]}
          />

          <Button
            disabled={createButtonDisabled}
            size='large'
            onClick={onCreate}
          >
            Создать
          </Button>
          <Button size='large' onClick={onClose}>
            Отменить
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default Posts;
