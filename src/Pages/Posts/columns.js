export const columns = [
  {
    title: 'product',
    dataIndex: 'product',
    key: 'product',
    render: (text) => text,
  },
  {
    title: 'states_title',
    dataIndex: 'states_title',
    key: 'states_title',
  },
  {
    title: 'states_id',
    dataIndex: 'states_id',
    key: 'states_id',
  },
  {
    title: 'Сертифицирование',
    key: 'certificate',
    dataIndex: 'certificate',
    render: (text) => text,
  },
  {
    title: 'Удаление',
    key: 'id',
    render: (text) => text,
  },
];
