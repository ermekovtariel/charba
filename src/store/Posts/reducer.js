import {
  LOADING_POSTS,
  SUCCESS_POSTS,
  ERROR_POSTS,
  DONE_LOADING_POSTS,
  SUCCESS_ADD_NEW_POSTS,
  SUCCESS_DELETE_NEW_POSTS,
  GET_PRODUCTS_MAP,
  GET_PRODUCTS_MAP_SUCCESS,
  GET_PRODUCTS_MAP_DONE,
  GET_PRODUCTS_MAP_UPDATE,
} from '../actionType';

const initialState = {
  posts: [],
  cards: [],
  states: [],
  productsItems: [],
  status: 'initial',
  products: {
    data: [],
    isLoading: false,
  },
};

const posts = (state = initialState, action) => {
  switch (action.type) {
    case LOADING_POSTS:
      return {
        ...state,
        status: 'loading',
      };
    case SUCCESS_POSTS:
      return {
        ...state,
        posts: action.payload,
        states: action.states,
        productsItems: action.productsItems,
        status: 'success',
      };
    case SUCCESS_ADD_NEW_POSTS:
      return {
        ...state,
        cards: [...state.cards, action.payload],
        status: 'success',
        isLoading: false,
      };
    case SUCCESS_DELETE_NEW_POSTS:
      return {
        ...state,
        cards: state.cards.filter(({ id }) => id !== action.payload),
        status: 'success',
        isLoading: false,
      };
    case DONE_LOADING_POSTS:
      return {
        ...state,
        status: 'initial',
      };
    case ERROR_POSTS:
      return {
        ...state,
        status: 'error',
      };

    case GET_PRODUCTS_MAP:
      return {
        ...state,
        products: {
          ...state.products,
          isLoading: true,
        },
      };
    case GET_PRODUCTS_MAP_SUCCESS:
      return {
        ...state,
        products: {
          ...state.products,
          data: action.payload,
          isLoading: false,
        },
      };
    case GET_PRODUCTS_MAP_UPDATE:
      return {
        ...state,
        products: {
          ...state.products,
          data: state.products.data.map((item) => {
            console.log(item, action.payload);
            // if (item.id === action.payload.id) {
            //   return action.payload;
            // }
            return item;
          }),
          isLoading: false,
        },
      };
    case GET_PRODUCTS_MAP_DONE:
      return {
        ...state,
        products: {
          ...state.products,
          isLoading: false,
        },
      };

    default:
      return state;
  }
};
export default posts;
