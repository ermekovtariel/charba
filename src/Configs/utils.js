import { lightFormat } from 'date-fns';
import { propOr } from 'ramda';
import { useEffect, useRef } from 'react';

const account = propOr(
  'client',
  'account',
  JSON.parse(localStorage.getItem('user') ?? '{}')
);
const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};
const checkPasswordStrength = (str) => {
  const passwordStrengthMap = [
    {
      text: 'Слабый пароль',
      color: 'rgb(255, 0, 0)',
    },
    {
      text: 'Средняя сложность',
      color: '#D7B627',
    },
    {
      text: 'Надежный пароль',
      color: 'rgb(0, 255, 0)',
    },
  ];
  const length = str.length;
  if (length < 8) {
    return passwordStrengthMap[0];
  }
  if (length <= 12) {
    return passwordStrengthMap[1];
  }
  if (length > 12) {
    return passwordStrengthMap[2];
  }
};

const sortStrings = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const sortNumbers = (a, b) => a - b;

const capitalizeFirstLetter = (str) =>
  `${str[0].toUpperCase()}${str.substring(1)}`;

const pluralize = (n, singular, plural, accusative) => {
  n = Math.abs(n);

  if (!Number.isInteger(n)) {
    return plural;
  }
  let n10 = n % 10;
  let n100 = n % 100;
  if (n10 === 1 && n100 !== 11) {
    return singular;
  }
  if (2 <= n10 && n10 <= 4 && !(12 <= n100 && n100 <= 14)) {
    return plural;
  }
  return accusative;
};

const findParent = (el, f) => {
  const parent = el.parentNode;
  if (parent === null) {
    return null;
  } else if (f(parent)) {
    return parent;
  } else {
    return findParent(parent, f);
  }
};

const zeroFirst = (s) => {
  return `0${s}`.substr(-2);
};

const parseServerDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${zeroFirst(d.getDate())}.${zeroFirst(
    d.getMonth() + 1
  )}.${d.getFullYear()} ${zeroFirst(d.getHours())}:${zeroFirst(
    d.getMinutes()
  )}:${zeroFirst(d.getSeconds())}`;
};

const arrEnd = (arr) => (arr.length === 0 ? null : arr[arr.length - 1]);

const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((value, index) => value === b[index])
  );
};

const objectsEquals = (a, b) => {
  for (let k in a) {
    if (!(b[k] && b[k] === a[k])) {
      return false;
    }
  }
  for (let k in b) {
    if (!(a[k] && a[k] === b[k])) {
      return false;
    }
  }
  return true;
};

const getExpandedTableData = ({
  data: rawData,
  expandedIds,
  childrenKey,
  idKey,
  addMargin,
}) => {
  let data = rawData.slice();
  let result = [];

  const setPath = (children, path, depth) => {
    for (let i = 0; i < children.length; i++) {
      const item = children[i];
      let currentPath = path.slice();
      item.depth_ = depth;

      if (depth === 0) {
        result.push(item);
      } else if (currentPath.every((id) => expandedIds.includes(id))) {
        result.push(addMargin({ ...item }, depth));
      }

      currentPath.push(item[idKey]);

      if (item[childrenKey]) {
        setPath(item[childrenKey], currentPath, depth + 1);
      }
    }
    return false;
  };
  setPath(data, [], 0);
  return result;
};

const recursiveFind = (arr, childrenKey, f) => {
  const iterateChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const itemI = children[i];
      if (f(itemI)) {
        return itemI;
      } else if (itemI[childrenKey] && itemI[childrenKey].length > 0) {
        const itres = iterateChildren(itemI[childrenKey]);
        if (itres) {
          return itres;
        }
      }
    }
    return false;
  };
  return iterateChildren(arr);
};

const arrayRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const formatDateTimezone = (date) => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
};

const measureTextSize = ({ text, className }) => {
  const span = document.createElement('span');
  span.style.opacity = 0;
  span.style.position = 'fixed';
  span.style.left = '-99999px';
  span.style.top = 0;

  span.innerText = text;
  className && span.classList.add(className);
  document.body.appendChild(span);

  const result = {
    width: span.offsetWidth,
    height: span.offsetHeight,
  };
  span.remove();
  return result;
};

const createReducer = (state, action, handlers) => {
  const { type, ...args } = action;
  return {
    ...state,
    ...handlers[type](args),
  };
};

const timestampToDateString = (timestamp) => {
  const months = [
    'Января',
    'Февраля',
    'Марта',
    'Апреля',
    'Мая',
    'Июня',
    'Июля',
    'Августа',
    'Сентября',
    'Октября',
    'Ноября',
    'Декабря',
  ];
  const timestampEntities = timestamp.split('-').map(Number);
  return `${timestampEntities[2]} ${months[
    timestampEntities[1] - 1
  ].toUpperCase()}`;
};

const timestampToDateStringBriefly = (timestamp) => {
  const months = [
    'Янв',
    'Фев',
    'Мар',
    'Апр',
    'Мая',
    'Июн',
    'Июл',
    'Авг',
    'Сен',
    'Окт',
    'Ноя',
    'Дек',
  ];
  const timestampEntities = timestamp.split('-').map(Number);
  return `${timestampEntities[2]} ${months[timestampEntities[1] - 1]}`;
};

const getGraph = (xPoints = 10, yMax = 100) =>
  [...Array(xPoints)].map((item, index) => ({
    value: Math.round(Math.random() * yMax),
    name: String(index),
  }));

const arraySplitInHalf = (arr) => {
  const arr_ = arr.slice();
  const half = Math.ceil(arr_.length / 2);

  return [arr_.splice(0, half), arr_.splice(-half)];
};

const mapObject = (obj, f) => {
  return Object.fromEntries(
    Object.entries(obj).map((item) => [item[0], f(item[0], item[1])])
  );
};

const filterObject = (obj, f) => {
  return Object.fromEntries(
    Object.entries(obj).filter((pair) => f(pair[0], pair[1]))
  );
};

const calcOffset = (page, perPage) => (page - 1) * perPage;

const isNumeric = (str) => typeof str === 'number' || /^-?\d+$/.test(str);

const minmax = (min, max) => {
  if (isNumeric(min) && isNumeric(max)) {
    return `${min},${max}`;
  } else if (isNumeric(min)) {
    return min;
  } else return null;
};

const objToUrlParams = (obj) => new URLSearchParams(obj).toString();

const downloadFile = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;

  a.setAttribute('download', filename);
  a.click();
  a.remove();
};

const palette = {
  blue: '#1E85FF',
  pink: '#CF3AA0',
  magentaPink: '#FF1292',
  darkModerateMagneta: '#B037B2',
  lightSlateGray: '#798097',
  purple: '#A83ACF',
  pastelGreen: '#59D65E',
  lightGreen: '#68B818',
  gamboge: '#E59700',
  gunPowderColor: '#43455C',
  paleLimeGreen: '#DBFFDA',
  paleRed: '#FFDEDA',
  lightGrayishBlue: '#E0E4EF',
  lightGrayBlue: '#D6DAE0',
  white: '#ffffff',
  darkYellow: '#b38900',
  transparent: '0000',
  darkViolet: '#1D0249',
  brown: '#8b4513',
  lightBlue: '#4dc3ff',
  blueGreen: '#088F8F',
};

const regExps = {
  phone: /^\+7 \(\d{3}\) \d{3} \d{2} \d{2}$/,

  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/,
  catalogUrl: /^https?:\/\/...?\.wildberries\..+?\/catalog\/(\d+)/,
  catalogUrlWildBoxLocalHost: /\/(\d+)+[\/]?/,

  sellerUrl: /^https?:\/\/...?\.wildberries\..+?\/seller\/(\d+)/,
  brandUrl: /^https?:\/\/...?\.wildberries\..+?\/brands\/(\w.+)/,
  catalogSectionsUrl: /^https?:\/\/...?\.wildberries\..+?\/catalog\/(\w.+)/,
};
const phoneMask = [
  '+',
  '7',
  ' ',
  '(',
  /\d/,
  /\d/,
  /\d/,
  ')',
  ' ',
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
];

const createWBLink = (id) =>
  `https://www.wildberries.ru/catalog/${id}/detail.aspx`;

const calcPercent = (total, quantity) =>
  total === 0 ? 0 : Math.round((100 / total) * quantity);

const colorCodes = [
  {
    name: 'синий',
    value: '#0000ff',
    stroke: '#0000ff',
  },
  {
    name: 'зеленый',
    value: '#00ff00',
    stroke: '#00ff00',
  },
  {
    name: 'коричневый',
    value: '#964b00',
    stroke: '#964b00',
  },
  {
    name: 'оранжевый',
    value: '#ffa500',
    stroke: '#ffa500',
  },
  {
    name: 'красный',
    value: '#ff0000',
    stroke: '#ff0000',
  },
  {
    name: 'розовый',
    value: '#ffc0cb',
    stroke: '#ffc0cb',
  },
  {
    name: 'серый',
    value: '#a9a9a9',
    stroke: '#a9a9a9',
  },
  {
    name: 'желтый',
    value: '#ffff00',
    stroke: '#ffff00',
  },
  {
    name: 'фиолетовый',
    value: '#800080',
    stroke: '#800080',
  },
  {
    name: 'черный',
    value: '#000000',
    stroke: '#000000',
  },
  {
    name: 'голубой',
    value: '#00bfff',
    stroke: '#00bfff',
  },
  {
    name: 'бежевый',
    value: '#f5f5dc',
    stroke: '#f5f5dc',
  },
  {
    name: 'белый',
    value: '#c8c8c8',
    stroke: '#c8c8c8',
  },
];

const getCountEnding = (count, singular, plural, accusative) => {
  let countString = count.toString();
  let lastsymbol = Number(countString[countString.length - 1]);
  if (lastsymbol === 1) {
    return singular;
  } else if (lastsymbol >= 2 && lastsymbol <= 4) {
    return plural;
  }
  return accusative;
};

const numberWithSpaces = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const dynamicDataCreator = (dynamicData) => {
  if (!dynamicData) {
    return;
  }
  const result = [];
  dynamicData.forEach((dynamic) => {
    for (const key in dynamic) {
      if (key === 'date') continue;
      const resultKey = `${key}_dynamic`;
      if (!result[resultKey]) {
        result[resultKey] = [];
      }
      result[resultKey].push({
        date: dynamic.date,
        y: dynamic[key],
      });
    }
  });
  return result;
};

const delay = (d) => new Promise((r) => setTimeout(r, d));

const addParamModifier = (str, modifier) => `${str}__${modifier}`;

const extractNumber = (str) => Number(String(str).replace(/\D/g, ''));

class CodeError extends Error {
  constructor({ message, ...rest }) {
    super(message);
    Object.assign(this, rest);
  }
}

const arrayUnique = (arr) =>
  arr.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

const loadAllPages = async ({ perPage }, f) => {
  const result = [];
  const load = async (page) => {
    const hasNextPage = await f({
      limit: perPage,
      offset: calcOffset(page, perPage),
      result,
    });
    if (!hasNextPage) return result;
    return await load(page + 1);
  };
  return await load(1);
};

const convertArrayToObject = (array, key) =>
  array.reduce((obj, item) => ({ ...obj, [item[key]]: item }), {});

const dateRangeToDays = (date1, date2) => {
  const firstDate = new Date(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  const secondDate = new Date(
    date2.getFullYear(),
    date2.getMonth(),
    date2.getDate()
  );

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const millisBetween = secondDate.getTime() - firstDate.getTime();
  const days = millisBetween / millisecondsPerDay;

  return Math.floor(Math.abs(days));
};

const usePrevious = (value, initialValue) => {
  const ref = useRef(initialValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const useEffectDebugger = (effectHook, dependencies, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies, []);

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps);
  }

  useEffect(effectHook, dependencies);
};

const generateRandomColor = () => {
  const color = (function func(m, s, c) {
    return s[m.floor(m.random() * s.length)] + (c && func(m, s, c - 1));
  })(Math, '3456789ABCDEF', 4);
  return color;
};

const darkenColor = (color) => {
  const hexPool = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
  ];
  const arr = color
    .replace('#', '')
    .split('')
    .map((c) =>
      hexPool.find((hex) => hex === c)
        ? c
        : hexPool[(hexPool.length * Math.random()) | 0]
    );
  return '#' + arr.join('');
};

const deletePropFromObject = (obj, keyPart) => {
  if (!keyPart) return obj;
  for (const k in obj) {
    if (k === keyPart) {
      delete obj[k];
    }
  }
  return obj;
};

const roundNumber = (num) => {
  return Math.round(num * 10) / 10;
};

const dateToTimestamp = (date) => {
  return lightFormat(date, 'yyyy-MM-dd');
};

export {
  sortStrings,
  dateToTimestamp,
  pluralize,
  getExpandedTableData,
  recursiveFind,
  zeroFirst,
  arrayRandom,
  arrEnd,
  createReducer,
  timestampToDateString,
  timestampToDateStringBriefly,
  measureTextSize,
  palette,
  arrayEquals,
  findParent,
  sortNumbers,
  capitalizeFirstLetter,
  getGraph,
  arraySplitInHalf,
  parseServerDate,
  phoneMask,
  regExps,
  checkPasswordStrength,
  mapObject,
  calcOffset,
  objectsEquals,
  minmax,
  isNumeric,
  objToUrlParams,
  createWBLink,
  calcPercent,
  downloadFile,
  account,
  colorCodes,
  getCountEnding,
  numberWithSpaces,
  dynamicDataCreator,
  delay,
  filterObject,
  addParamModifier,
  extractNumber,
  CodeError,
  arrayUnique,
  loadAllPages,
  convertArrayToObject,
  dateRangeToDays,
  useEffectDebugger,
  generateRandomColor,
  darkenColor,
  deletePropFromObject,
  formatDateTimezone,
  roundNumber,
  getBase64,
};
