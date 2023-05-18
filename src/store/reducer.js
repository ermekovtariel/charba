import { combineReducers } from 'redux';

import auth from './Auth/reducer';
import homePage from './Home/reducer';
import postPage from './Posts/reducer';

const rootReducer = combineReducers({
  auth,
  homePage,
  postPage,
});

export default rootReducer;
