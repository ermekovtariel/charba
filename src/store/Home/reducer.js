import {
  ERROR_PRODUCTS,
  ERROR_STATES,
  LOADING_PRODUCTS,
  LOADING_STATES,
  SUCCESS_PRODUCTS,
  SUCCESS_STATES,
} from '../actionType';

const initialState = {
  states: {
    data: [],
    status: 'initial',
  },
  products: {
    data: [],
    status: 'initial',
  },
  status: 'initial',
};

const states = (state = initialState, action) => {
  switch (action.type) {
    case LOADING_STATES:
      return {
        ...state,
        states: {
          ...state.states,
          status: 'loading',
        },
      };
    case SUCCESS_STATES:
      return {
        ...state,
        states: {
          ...state.states,
          data: action.payload,
          status: 'success',
        },
      };
    case ERROR_STATES:
      return {
        ...state,
        states: {
          ...state.states,
          status: 'error',
        },
      };

    case LOADING_PRODUCTS:
      return {
        ...state,
        products: {
          ...state.products,
          status: 'loading',
        },
      };
    case SUCCESS_PRODUCTS:
      return {
        ...state,
        products: {
          ...state.products,
          data: action.payload,
          status: 'success',
        },
      };
    case ERROR_PRODUCTS:
      return {
        ...state,
        products: {
          ...state.products,
          status: 'error',
        },
      };

    default:
      return state;
  }
};
export default states;
