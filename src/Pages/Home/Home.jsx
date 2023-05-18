/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Result, Select, Table, Tabs } from 'antd';
import { Column } from '@ant-design/plots';
import { useDownloadExcel } from 'react-export-table-to-excel';
import { DownloadOutlined } from '@ant-design/icons';

import { KG } from '../../Configs/places';
import { defaultToArr, isMobile } from '../../Configs/halpers';

import './Home.scss';
import { clone, isEmpty, isNil, length, prop, propOr, sum } from 'ramda';
import instance from '../../utils/instance';
import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import { numberWithSpaces } from '../../Configs/utils';

const Home = () => {
  const tableRef = useRef(null);

  const [products, setProducts] = useState({
    data: [],
    isLoading: false,
  });
  const [form, setForm] = useState({
    id: 1,
    value: 'Чуйская',
  });

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `Статистика АГРО промышленности: ${form.value} область`,
    sheet: 'Users',
  });

  const setIsSelected = (e) => {
    const object = KG.find(({ id }) => Number(id) === Number(e));
    setForm(object);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setProducts((state) => ({ ...state, isLoading: true }));
        const { data } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/${form.id}`
        );
        const { data: statePrice } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/marcketplace?state_id=${form.id}`
        );

        const { data: statistic } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/statistic`
        );

        const newData = defaultToArr(data).map((item) => {
          const prictArr = defaultToArr(statePrice)
            .filter(({ product_id }) => product_id === item.product_id)
            .map(({ price }) => price);
          const place = defaultToArr(
            propOr([], 'data', prop(form.id, statistic))
          ).find(({ kilogram }) => kilogram.product_id === item.product_id);

          const need =
            propOr(0, 'value', prop('kilogram', place)) *
              statistic[form.id].people -
            item.value * 25000;

          return {
            ...item,
            price: isNaN(sum(prictArr) / length(prictArr))
              ? 0
              : numberWithSpaces(sum(prictArr) / length(prictArr)),

            need: numberWithSpaces(need / 25000),
            max: numberWithSpaces(
              sum([need / 25000, propOr(0, 'value', item)])
            ),
          };
        });
        console.log(newData);
        setProducts((state) => ({ ...state, data: newData }));
      } catch (error) {
        console.log(error);
      }

      setProducts((state) => ({ ...state, isLoading: false }));
    };
    fetchData();
  }, [form]);

  useEffect(() => {
    try {
      let tableSelect = document.querySelector('table');
      if (!isNil(prop('id', tableSelect))) {
        tableSelect.id = 'table';
      }
    } catch (error) {
      console.log(error);
    }
  }, [products.status]);

  const config = {
    data: propOr([], 'data', products).sort(
      (a, b) => Number(propOr(0, 'max', b)) - Number(propOr(0, 'max', a))
    ),
    xField: 'product',
    yField: 'value',
    seriesField: 'product',
    isGroup: true,
    columnStyle: {
      radius: [5, 5, 0, 0],
    },
    label: {
      position: 'middle',
      layout: [
        {
          type: 'interval-adjust-position',
        },
        {
          type: 'interval-hide-overlap',
        },
        {
          type: 'adjust-color',
        },
      ],
    },
    // tooltip: {
    //   title: (value) => {
    //     // return `${propOr('', 'value', form)} область`;
    //     return ' ';
    //   },
    // },
  };

  const homeColumns = [
    {
      title: 'Продукт',
      dataIndex: 'product',
      key: 'product',
      fixed: 'left',
    },
    {
      title: 'Гeктар посеяно',
      dataIndex: 'value',
      key: 'value',
      render: (value) => value + ' га',
    },
    {
      title: 'Цена на гектар (c)',
      dataIndex: 'price',
      key: 'price',
      render: (value) => `${value} c`,
    },
    {
      title: 'Максимально можно посадить (га)',
      dataIndex: 'max',
      key: 'max',
      render: (value) => `${value} га`,
    },
    {
      title: 'Еще посадить (га)',
      dataIndex: 'need',
      key: 'need',
      render: (value) => `${value} га`,
    },
  ];

  if (isMobile) {
    return (
      <>
        <div className='mobileHomeOblPicker'>
          <span>Анализ АГРО в области:</span>
          <Select
            defaultValue={form.value}
            style={{ width: 120 }}
            onChange={(_, e) => {
              setIsSelected(e.id);
            }}
            options={KG}
          />
        </div>

        {isEmpty(propOr([], 'data', products)) ? (
          <Result
            style={{
              padding: 0,
            }}
            status='404'
            title='Нет данных'
            subTitle={
              <>
                В ближайщем будущем данные этой области соберутся.
                <br></br>
                Тогда вы сможете проанализировать рынок.
                <br></br>
                Благодарим что вы вместе с нами
              </>
            }
            // extra={<Button type='primary'>Back Home</Button>}
          />
        ) : (
          <Column style={{ zIndex: 10 }} {...config} />
        )}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              margin: '1rem 0',
            }}
          >
            <Button
              onClick={onDownload}
              disabled={products.status === 'loading' || isEmpty(products.data)}
            >
              Скачать таблицу <DownloadOutlined />
            </Button>
          </div>
          <Table
            dataSource={propOr([], 'data', products).sort(
              (a, b) =>
                Number(propOr(0, 'max', b)) - Number(propOr(0, 'max', a))
            )}
            ref={tableRef}
            id='table'
            pagination={{
              position: ['none', 'none'],
            }}
            loading={products.status === 'loading'}
            columns={homeColumns}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div>
          <span>Анализ АГРО в области:</span>

          <Tabs onChange={setIsSelected} defaultActiveKey={form.id}>
            {KG.map(({ title, id }) => (
              <Tabs.TabPane
                style={{
                  position: 'sticky',
                  top: '10px',
                  background: '#fff',
                  zIndex: '10000000000000000',
                }}
                tab={title}
                key={id}
              >
                {isEmpty(propOr([], 'data', products)) ? (
                  <Result
                    style={{
                      padding: 0,
                    }}
                    status='404'
                    title='Нет данных'
                    subTitle={
                      <>
                        В ближайщем будущем данные этой области соберутся.
                        <br></br>
                        Тогда вы сможете проанализировать рынок.
                        <br></br>
                        Благодарим что вы вместе с нами
                      </>
                    }
                  />
                ) : (
                  <Column style={{ zIndex: 10 }} {...config} />
                )}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row-reverse',
                      margin: '1rem 0',
                    }}
                  >
                    <Button
                      onClick={onDownload}
                      disabled={
                        products.status === 'loading' || isEmpty(products.data)
                      }
                    >
                      Скачать таблицу <DownloadOutlined />
                    </Button>
                  </div>
                  <Table
                    ref={tableRef}
                    id='table'
                    dataSource={clone(propOr([], 'data', products)).sort(
                      (a, b) =>
                        Number(propOr(0, 'max', b)) -
                        Number(propOr(0, 'max', a))
                    )}
                    pagination={{
                      position: ['none', 'none'],
                    }}
                    loading={products.status === 'loading'}
                    columns={homeColumns}
                  />
                </div>
              </Tabs.TabPane>
            ))}
          </Tabs>
        </div>
      </>
    );
  }
};
export default Home;
