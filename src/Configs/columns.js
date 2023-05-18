export const homeColumns = [
  {
    title: 'Продукт',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Гeктар посеяно',
    dataIndex: 'value',
    key: 'value',
    render: (value) => value + ' га',
  },
  {
    title: 'Цена на гектар',
    dataIndex: 'price',
    key: 'price',
    render: (value) => value,
  },
];
