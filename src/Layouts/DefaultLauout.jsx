import {
  PieChartOutlined,
  FileSearchOutlined,
  PlusSquareOutlined,
  LogoutOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';
import './DefaultLauout.scss';
import { Layout, Menu } from 'antd';
import React, { useMemo, useState } from 'react';
import { Link, useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { Footer } from 'antd/lib/layout/layout';
import useDeviceDetect from '../hooks/useDeviceDetect';
import { prop, propOr } from 'ramda';
import { account } from '../Configs/utils';

const { Content, Sider } = Layout;

const getItem = (label, key, icon, children) => {
  return {
    key,
    icon,
    children,
    label,
  };
};

const items = [
  getItem(
    'Анализ рынка',
    '/analyze',
    <Link to='/analyze'>
      <PieChartOutlined />
    </Link>
  ),
  getItem(
    account === 'client' ? 'Мои участки' : 'Участки области',
    '/plots',
    <Link to='/plots'>
      <PlusSquareOutlined />
    </Link>
  ),
  getItem(
    'Обьявления',
    '/add',
    <Link to='/add'>
      <FileSearchOutlined />
    </Link>
  ),
  // getItem(
  //   'Профиль',
  //   '/user',
  //   <Link to='/user'>
  //     <UserOutlined />
  //   </Link>
  // ),
  account === 'root' &&
    getItem(
      'Справки',
      '/reference',
      <Link to='/reference'>
        <SnippetsOutlined />
      </Link>
    ),
  getItem(
    'Выход',
    '/Выход',
    <Link
      onClick={() => {
        localStorage.clear();
        document.location.reload();
      }}
      to='/Выход'
    >
      <LogoutOutlined />
    </Link>
  ),
];

const DefaultLauout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const history = useHistory();
  const { isMobile: isMobileADW } = useDeviceDetect();
  const isMobile = isMobileADW;

  const routMap = useMemo(() => {
    return propOr('/analyze', 'pathname', prop('location', history));
  }, [history]);

  return (
    <Layout
      style={{
        maxHeight: '100vh',
      }}
    >
      {!isMobile && (
        <Sider
          // collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          // trigger={"Закрыть"}
        >
          <ul className='ant-menu ant-menu-root ant-menu-vertical ant-menu-dark'>
            <li
              style={{
                display: `${collapsed ? 'flex' : 'block'}`,
                justifyContent: `${collapsed ? 'center' : 'center'}`,
              }}
              className='ant-menu-item'
            >
              <div className='logo' id='logo'>
                <div className='logoImage'></div>
                <Link
                  // to='analyze'
                  style={{
                    display: `${collapsed ? 'none' : 'block'}`,
                    color: 'white',
                  }}
                  className='logoTitle'
                >
                  Ayil-Charba
                </Link>
              </div>
            </li>
          </ul>
          <Menu
            theme='dark'
            // activeKey={routMap}
            // defaultActiveFirst={true}

            onMouseOver={() => setCollapsed(false)}
            onMouseLeave={() => setCollapsed(true)}
            // defaultSelectedKeys={[`${history.location.pathname}`]}
            defaultSelectedKeys={routMap}
            items={items}
          />
        </Sider>
      )}
      <Layout className='site-layout'>
        <Content
          style={{
            margin: isMobile ? '0' : '16px',
            height: '100vh',
            // overflowY: 'scroll',
          }}
        >
          <div className='site-layout-background'>{children}</div>
        </Content>
      </Layout>
      {isMobile && (
        <Footer className='footerActions'>
          <div className='logo' />
          <Menu
            theme='dark'
            mode='horizontal'
            defaultSelectedKeys={[`${history.location.pathname}`]}
            items={items}
          />
        </Footer>
      )}
    </Layout>
  );
};
export default DefaultLauout;
