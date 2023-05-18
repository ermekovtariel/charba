import React, { useEffect, useMemo, useState } from 'react';
import './add.scss';
import instance from '../../utils/instance';
import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import {
  notification,
  Card,
  List,
  Button,
  Drawer,
  DatePicker,
  InputNumber,
  Select,
} from 'antd';
import potato from '../../Assets/potato.png';
import tomato from '../../Assets/tomato.png';
import onion from '../../Assets/onion.png';
import broccoli from '../../Assets/broccoli.png';
import eggplant from '../../Assets/eggplant.png';
import zucchini from '../../Assets/zucchini.png';
import cabbage from '../../Assets/cabbage.png';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
  SettingOutlined,
  SmallDashOutlined,
} from '@ant-design/icons';
import { clone, isNil, trim } from 'ramda';
import { isMobile, userLS } from '../../Configs/halpers';
import { account, dateToTimestamp } from '../../Configs/utils';

const { Meta } = Card;
const { RangePicker } = DatePicker;

function Add() {
  const [productsItems, setProductsItems] = useState([]);
  const [states, setStates] = useState([]);

  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [date, setDate] = useState({
    startDate: dateToTimestamp(
      new Date(new Date().setMonth(new Date().getMonth() - 1))
    ),
    endDate: dateToTimestamp(new Date()),
  });
  const [dreawerForm, setDreawerForm] = useState({
    value: 1,
    price: 0,
  });
  const [search, setsearch] = useState('');
  const [searchStateId, setSearchStateId] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [api, contextHolder] = notification.useNotification();

  const isSearching =
    trim(`${search}`) !== '' || trim(`${searchStateId}`) !== '';

  const openNotification = ({ type, title, message }) => {
    api[type]({
      message: title,
      description: message,
    });
  };

  const loadMoreData = async () => {
    setProducts([]);
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      const { data } = await instance.get(
        `${URL_BACK}:${LOCAL_PORT_BACK}/marcketplace?created_date_gte=${date.startDate}&created_date_lte=${date.endDate}`
      );
      setProducts((state) => [...state, ...data]);
    } catch (error) {
      console.log(error);
      openNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить список',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMoreData();
  }, [date]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: states } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/states`
        );
        setStates(states);
        const { data: productsItems } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/productsItems`
        );
        setProductsItems(productsItems);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const open = () => {
    setIsOpen(true);
  };
  const close = () => {
    setDreawerForm({
      value: 1,
      price: 0,
    });
    setIsOpen(false);
  };

  const handleChangeDrower = (type, e) => {
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
    if (type === 'price') {
      setDreawerForm((state) => ({ ...state, price: e }));
    }
  };

  const disabledDreawerForm = useMemo(
    () =>
      !dreawerForm.price ||
      !dreawerForm.product ||
      !dreawerForm.value ||
      !dreawerForm.state,
    [dreawerForm]
  );

  const onAdd = async () => {
    try {
      const newObj = {
        title: dreawerForm.product.product.toLowerCase(),
        product_id: dreawerForm.product.id,
        state: dreawerForm.state.title,
        state_id: dreawerForm.state.id,
        user_id: userLS.id,
        value: dreawerForm.value,
        price: dreawerForm.price,
        created_date: dateToTimestamp(new Date()),
        number: `+${userLS.phone}`,
      };
      const { data } = await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/marcketplace`,
        newObj
      );
      setProducts((state) => [...state, data]);
      close();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const onDelete = async (id) => {
    try {
      await instance.delete(
        `${URL_BACK}:${LOCAL_PORT_BACK}/marcketplace/${id}`
      );
      setProducts((state) => state.filter((item) => item.id !== id));
      close();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/marcketplace?${
            trim(`${search}`) !== '' ? 'product_id=' + search : ''
          }&${
            trim(`${searchStateId}`) !== '' ? 'state_id=' + searchStateId : ''
          }`
        );
        setSearchData(data);
      } catch (error) {
        console.log(error);
      }
    };
    if (trim(`${search}`) !== '' || trim(`${searchStateId}`) !== '') {
      fetchData();
    }
  }, [search, searchStateId]);

  return (
    <>
      {contextHolder}
      <div className='add_page_box'>
        <div className='add_page__filters'>
          <div className='add_page__filters_button'>
            <RangePicker
              defaultValue={date}
              format={'DD-MM-YYYY'}
              size='large'
              disabledDate={(item) =>
                dateToTimestamp(new Date(item)) > dateToTimestamp(new Date())
              }
              onChange={(e) => {
                if (isNil(e)) {
                  return setDate(() => ({
                    startDate: dateToTimestamp(
                      new Date(new Date().setMonth(new Date().getMonth() - 1))
                    ),
                    endDate: dateToTimestamp(new Date()),
                  }));
                }
                setDate(() => ({
                  startDate: dateToTimestamp(new Date(e[0])),
                  endDate: dateToTimestamp(new Date(e[1])),
                }));
              }}
            />
            <div className='filters_data'>
              <Button
                size='large'
                onClick={() => setFilterOpen((state) => !state)}
              >
                {filterOpen ? <SmallDashOutlined /> : <SettingOutlined />}
              </Button>
            </div>
          </div>
          {filterOpen && (
            <Select
              size='large'
              defaultValue={dreawerForm.product_id}
              value={dreawerForm.product_id}
              style={{ width: '100%' }}
              placeholder='Выберите продукт'
              showSearch
              allowClear
              onClear={() => setSearchStateId('')}
              optionFilterProp='children'
              onSelect={(e) => setSearchStateId(e)}
              options={[
                ...states.map(({ id, title }) => ({
                  value: id,
                  label: title,
                })),
              ].sort((a, b) => b.id - a.id)}
            />
          )}
          {filterOpen && (
            <Select
              size='large'
              defaultValue={dreawerForm.product_id}
              value={dreawerForm.product_id}
              style={{ width: '100%' }}
              placeholder='Выберите продукт'
              showSearch
              optionFilterProp='children'
              allowClear
              onClear={() => setsearch('')}
              onSelect={(e) => setsearch(e)}
              options={[
                ...productsItems.map(({ id, product }) => ({
                  value: id,
                  label: product,
                })),
              ].sort((a, b) => b.id - a.id)}
            />
          )}
        </div>
        <Button
          onClick={open}
          type='primary'
          icon={<PlusOutlined />}
          className={'button'}
          size={'large'}
        >
          Создать карточку
        </Button>
      </div>
      <List className={'list_box'}>
        {clone(isSearching ? searchData : products)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .map(({ user_id, id, product_id, number, price, title, value }) => (
            <Card
              hoverable
              style={{ width: 240 }}
              className='card'
              cover={
                <img
                  alt='example'
                  src={
                    (product_id === 1 && potato) ||
                    (product_id === 2 && tomato) ||
                    (product_id === 3 && onion) ||
                    (product_id === 4 && eggplant) ||
                    (product_id === 5 && zucchini) ||
                    (product_id === 6 && cabbage) ||
                    (product_id === 7 && broccoli) ||
                    'data:image/png;base64,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'
                  }
                />
              }
              actions={[
                <a href={`tel:${number}`}>
                  <PhoneOutlined />
                </a>,
                undefined,
                userLS.id === user_id || account === 'root' ? (
                  <DeleteOutlined onClick={() => onDelete(id)} key='ellipsis' />
                ) : undefined,
              ]}
            >
              <Meta
                title={
                  <>
                    <span
                      style={{
                        textTransform: 'capitalize',
                      }}
                    >
                      {title}
                    </span>
                    <br></br>
                    <a href={`tel:${number}`}>
                      <span>{number}</span>
                    </a>
                  </>
                }
                description={
                  <div className='cardValues'>
                    <span>Гектар:{value}</span>
                    <span>Цена:{price}</span>
                  </div>
                }
              />
            </Card>
          ))}
      </List>
      <Drawer
        title='Создать карточку'
        width={isMobile ? '100%' : undefined}
        onClose={close}
        open={isOpen}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <div className='inputes_new_card'>
          <Select
            size='large'
            defaultValue={dreawerForm.product_id}
            value={dreawerForm.product_id}
            style={{ width: '100%' }}
            placeholder='Выберите продукт'
            showSearch
            optionFilterProp='children'
            onChange={(e) => handleChangeDrower('product', e)}
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
            onChange={(e) => handleChangeDrower('state', e)}
            options={[
              ...states.map(({ id, title }) => ({
                value: id,
                label: title,
              })),
            ]}
          />
          <InputNumber
            min={1}
            max={300}
            size='large'
            onChange={(e) => handleChangeDrower('inputNumber', e)}
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
          <InputNumber
            min={0}
            size='large'
            onChange={(e) => handleChangeDrower('price', e)}
            addonAfter='сом'
            placeholder='Цена'
          />
          <Button onClick={onAdd} size='large' disabled={disabledDreawerForm}>
            Добавить
          </Button>
          <Button size='large' onClick={close}>
            Отменить
          </Button>
        </div>
      </Drawer>
    </>
  );
}

export default Add;
