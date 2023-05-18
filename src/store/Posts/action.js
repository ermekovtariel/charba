import { isEmpty, prop } from 'ramda';
import { LOCAL_PORT_BACK, URL_BACK } from '../../utils/API';
import instance from '../../utils/instance';
import { account } from '../../Configs/utils';
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

export const fetchPosts = () => async (dispatch) => {
  dispatch({
    type: LOADING_POSTS,
  });
  try {
    const user = JSON.parse(localStorage.getItem('user'), '{}');
    const { data } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts${
        account === 'client' ? '?user_id=' + prop('id', user) : ''
      }`
    );

    const states = await instance.get(`${URL_BACK}:${LOCAL_PORT_BACK}/states`);
    const { data: productsItems } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/productsItems`
    );

    dispatch({
      type: GET_PRODUCTS_MAP_SUCCESS,
      payload: data,
    });

    dispatch({
      type: SUCCESS_POSTS,
      payload: data,
      states: states.data,
      productsItems: productsItems,
    });
  } catch (error) {
    dispatch({
      type: ERROR_POSTS,
    });
  }
};

export const newPlot =
  ({ value, product_id, states_id, states_title, product_title }) =>
  async (dispatch) => {
    dispatch({
      type: LOADING_POSTS,
    });
    try {
      const user = JSON.parse(localStorage.getItem('user'), '{}');
      const newProduct = {
        user_id: user?.id,
        states_id,
        states_title,
        product_id,
        product: product_title,
        certificate: 0,
        value,
      };
      const { data } = await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts`,
        newProduct
      );
      dispatch({
        type: SUCCESS_ADD_NEW_POSTS,
        payload: data,
      });
      try {
        const { data: productData } = await instance.get(
          `${URL_BACK}:${LOCAL_PORT_BACK}/stateProducts/${product_id}`
        );
        const patchData = {
          ...productData,
          value: productData.value + value,
        };
        await instance.patch(
          `${URL_BACK}:${LOCAL_PORT_BACK}/stateProducts/${product_id}`,
          patchData
        );
      } catch (error) {
        const patchData = [
          {
            id: 1,
            product: product_title,
            product_id,
            states_id,
            value,
          },
        ];
        await instance.patch(
          `${URL_BACK}:${LOCAL_PORT_BACK}/stateProducts/${product_id}`,
          patchData
        );
      }
    } catch (error) {
      console.log('err');
      dispatch({
        type: ERROR_POSTS,
      });
    }
    dispatch({
      type: DONE_LOADING_POSTS,
    });
  };
export const delPlot =
  ({ id, product_id, certificate, value }) =>
  async (dispatch) => {
    dispatch({
      type: LOADING_POSTS,
    });
    try {
      await instance.delete(
        `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${id}`
      );

      const { data: productData } = await instance.get(
        `${URL_BACK}:${LOCAL_PORT_BACK}/stateProducts/${product_id}`
      );
      console.log(certificate);
      if (certificate === 1) {
        const patchData = {
          ...productData,
          value: productData.value - value,
        };
        await instance.patch(
          `${URL_BACK}:${LOCAL_PORT_BACK}/stateProducts/${product_id}`,
          patchData
        );
      }
      dispatch({
        type: SUCCESS_DELETE_NEW_POSTS,
        payload: id,
      });
    } catch (error) {
      console.log('err');
      dispatch({
        type: ERROR_POSTS,
      });
    }
    dispatch({
      type: DONE_LOADING_POSTS,
    });
  };

export const patchPlusStateProducts = (card) => async (dispatch) => {
  try {
    dispatch({
      type: GET_PRODUCTS_MAP,
    });

    await instance.patch(
      `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${card.id}`,
      { ...card, certificate: 1 }
    );

    const { data } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/?product_id=${card.product_id}`
    );

    if (isEmpty(data)) {
      const newObj = {
        product: card.product,
        value: card.value,
        product_id: card.product_id,
      };
      await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}`,
        newObj
      );
      dispatch({
        type: GET_PRODUCTS_MAP_SUCCESS,
        payload: newObj,
      });
      return;
    }

    const newObj = {
      ...data[0],
      value: data[0].value + card.value,
    };

    await instance.patch(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${data[0].id}`,
      newObj
    );
  } catch (error) {
    console.log(error);
  }

  dispatch({
    type: GET_PRODUCTS_MAP_DONE,
  });
};

export const patchMinusStateProducts = (card) => async (dispatch) => {
  try {
    await instance.patch(
      `${URL_BACK}:${LOCAL_PORT_BACK}/userProducts/${card.id}`,
      { ...card, certificate: 0 }
    );

    const { data } = await instance.get(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/?product_id=${card.product_id}`
    );

    const newObj = {
      ...data[0],
      value: data[0].value - card.value,
    };

    await instance.patch(
      `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}/${data[0].id}`,
      newObj
    );
  } catch (error) {
    try {
      const newObj = {
        product: card.product,
        product_ids: [card.id],
        value: card.value,
        product_id: card.product_id,
      };
      await instance.post(
        `${URL_BACK}:${LOCAL_PORT_BACK}/${card.states_id}`,
        newObj
      );
    } catch (error) {
      console.log(error);
    }
    console.log(error);
  }
};

