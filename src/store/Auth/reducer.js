import { AUTH, AUTH_ERROR, AUTH_SUCCESS } from '../actionType';

const initialState = {
  auth: {},
  status: false,
};

const auth = (state = initialState, action) => {
  switch (action.type) {
    case AUTH:
      return {
        ...state,
        auth: action.payload,
      };
    case AUTH_SUCCESS:
      return {
        ...state,
        status: action.payload,
      };
    case AUTH_ERROR:
      return {
        ...state,
        status: action.payload,
      };
    default:
      return state;
  }
};
export default auth;
