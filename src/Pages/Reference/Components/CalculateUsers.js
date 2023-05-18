import React, { useEffect, useState } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic } from 'antd';
import { pluralize } from '../../../Configs/utils';
import { LOCAL_PORT_BACK, URL_BACK } from '../../../utils/API';
import instance from '../../../utils/instance';
import { length } from 'ramda';

const permitionPluralize = ['участку', 'участкам', 'участкам'];
// const permitionPluralize = ['выбранный', 'выбранных', 'выбранных'];

const App = () => {
  const [date, setDate] = useState({
    approved: 0,
    denied: 0,
    users: 0,
  });
  const fetchData = async () => {
    const { data: approved } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts`
    );
    const { data: users } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/users?account=client`
    );
    setDate({
      approved: length(approved.filter(({ certificate }) => certificate)),
      denied: length(approved.filter(({ certificate }) => !certificate)),
      users: length(users),
    });
  };
  useEffect(() => {
    // setInterval(() => fetchData(), 30000);
    fetchData();
  }, []);

  return (
    <div className='site-statistic-demo-card'>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title='Одобрено'
              value={date.approved}
              valueStyle={{
                color: '#3f8600',
              }}
              prefix={<ArrowUpOutlined />}
              suffix={pluralize(date.approved, ...permitionPluralize)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='Не одобрено'
              value={date.denied}
              valueStyle={{
                color: '#cf1322',
              }}
              prefix={<ArrowDownOutlined />}
              suffix={pluralize(date.denied, ...permitionPluralize)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='Пользователей'
              value={date.users}
              valueStyle={{
                color: '#0071ff',
              }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default App;
