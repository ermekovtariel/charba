import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import instance from '../../utils/instance';
import {
  ERROR_PRODUCTS,
  ERROR_STATES,
  LOADING_PRODUCTS,
  LOADING_STATES,
  SUCCESS_PRODUCTS,
  SUCCESS_STATES,
} from '../actionType';

export const fetchStates = (credentials) => async (dispatch) => {
  dispatch({
    type: LOADING_STATES,
  });
  try {
    const { data } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/states`
    );

    dispatch({
      type: SUCCESS_STATES,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ERROR_STATES,
    });
  }
};

export const fetchProducts = (credentials) => async (dispatch) => {
  dispatch({
    type: LOADING_PRODUCTS,
  });
  try {
    const { data } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${credentials.id}`
    );

    dispatch({
      type: SUCCESS_PRODUCTS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ERROR_PRODUCTS,
    });
  }
};
