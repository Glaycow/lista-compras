import {DBConfig} from 'ngx-indexed-db';

export const dbConfig: DBConfig = {
  name: 'MyDb',
  version: 1,
  objectStoresMeta: [
    {
      store: 'compra',
      storeConfig: {keyPath: 'id', autoIncrement: true},
      storeSchema: [
        {name: 'nome', keypath: 'nome', options: {unique: false}},
        {name: 'data', keypath: 'data', options: {unique: false}},
      ]
    },
    {
      store: 'itens-compra',
      storeConfig: {keyPath: 'id', autoIncrement: true},
      storeSchema: [
        {name: 'nome', keypath: 'nome', options: {unique: false}},
        {name: 'data', keypath: 'data', options: {unique: false}},
        {name: 'quantidade', keypath: 'quantidade', options: {unique: false}},
        {name: 'valor', keypath: 'valor', options: {unique: false}},
        {name: 'marca', keypath: 'marca', options: {unique: false}},
        {name: 'pego', keypath: 'pego', options: {unique: false}},
        {name: 'compraId', keypath: 'compraId', options: {unique: false}},
      ]
    }
  ]
};
