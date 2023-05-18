import React, { useEffect, useState } from 'react';
import CalculateUsers from '../Components/CalculateUsers';
import { Button, Divider, Input, InputNumber, Table, Tabs } from 'antd';
import { LOCAL_PORT_BACK, URL_BACK } from '../../../utils/API';
import instance from '../../../utils/instance';
import { isEmpty, isNil, length, prop, propOr, trim } from 'ramda';
import './index.scss';
import { pluralize } from '../../../Configs/utils';

const peoplePluralize = ['человек', 'человека', 'человек', 'человека'];

const App = () => {
  const [tabs, setTabs] = useState([]);
  const [data, setdata] = useState({});
  const [tab, setTab] = useState(1);

  const onChange = ({ product_id, value }) => {
    setdata((state) => ({
      ...state,
      [tab]: {
        ...state[tab],
        data: state[tab].data.map((item) => {
          if (item.kilogram.product_id === product_id) {
            return {
              ...item,
              kilogram: {
                ...item.kilogram,
                value,
              },
            };
          }
          return item;
        }),
      },
    }));
  };

  const fetchStates = async () => {
    const { data: states } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/states`
    );
    setTabs(
      states.map(({ title, id }) => ({
        key: id,
        label: title,
      }))
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await instance.get(
        `${URL_BACK}:${LOCAL_PORT_BACK}/statistic`
      );
      setdata(data);
    };
    fetchStates();
    fetchData();
  }, []);

  const columns = [
    {
      key: 'product',
      title: 'Продукт',
      dataIndex: 'product',
    },
    {
      key: 'kilogram',
      title: 'Килограмм на человека',
      dataIndex: 'kilogram',
      render: ({ product_id, value }) => (
        <InputNumber
          value={Number(value)}
          onChange={(e) =>
            onChange({
              product_id,
              value: isNil(e) ? 0 : e,
            })
          }
        />
      ),
    },
  ];

  const onSave = async () => {
    try {
      await instance.patch(`${URL_BACK}:${LOCAL_PORT_BACK}/statistic`, data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Divider style={{ borderColor: '#0071ff' }} dashed orientation='left'>
        Иформация по участкам и пользователям
      </Divider>
      <CalculateUsers />

      <Divider style={{ borderColor: '#0071ff' }} dashed orientation='left'>
        Данные о потреблениях оращаемой продукции
      </Divider>
      <Tabs onChange={(e) => setTab(e)} activeKey={tab} items={tabs} />
      <div className='actions'>
        <div className='all_people'>
          <span>
            Население проживающие «
            {propOr('Кыргызстана', 'label', prop(tab - 1, tabs))}»
          </span>{' '}
          <InputNumber
            value={propOr(0, 'people', prop(tab, data))}
            width={'100%'}
            onChange={(e) =>
              setdata((state) => ({
                ...state,
                [tab]: {
                  ...state[tab],
                  people: e,
                },
              }))
            }
          />{' '}
          {pluralize(propOr(0, 'people', prop(tab, data)), ...peoplePluralize)}
        </div>
        <Button
          style={{
            marginBottom: '1rem',
          }}
          size='large'
          type='primary'
          onClick={onSave}
        >
          Сохранить
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={propOr([], 'data', prop(tab, data))}
      />
    </>
  );
};

export default App;
