import './App.css';
import React from 'react';
import { useRoutes } from './router';
import { BrowserRouter as Router } from 'react-router-dom';
import 'antd/dist/antd.css';

const App = () => {
  const json = localStorage.getItem('user');
  const routes = useRoutes(json);

  return <Router>{routes}</Router>;
};

export default App;
