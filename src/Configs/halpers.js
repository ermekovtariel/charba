import { defaultTo } from 'ramda';

export const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
export const userLS = JSON.parse(localStorage.getItem('user') ?? '{}');

export const defaultToArr = defaultTo([]);
export const defaultToObj = defaultTo({});
export const defaultToStr = defaultTo('');
