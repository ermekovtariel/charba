import { createStore, compose, applyMiddleware } from 'redux';
// import { createStoreHook } from 'react-redux';
import thunk from 'redux-thunk';

import rootReducer from './reducer';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
