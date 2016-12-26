/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
import {csv, text as d3text, extent as d3extent} from 'd3';
import {uniqueString, mixin} from 'phovea_core/src';
import {IDataDescription, IValueType, VALUE_TYPE_INT, VALUE_TYPE_REAL, IValueTypeDesc} from 'phovea_core/src/datatype';
import {Range, join} from 'phovea_core/src/range';
import {IMatrix, IMatrixDataDescription} from 'phovea_core/src/matrix';
import {create as createMatrix, IMatrixLoader2} from 'phovea_core/src/matrix_impl';
import {ITable, ITableDataDescription, ITableColumn} from 'phovea_core/src/table';
import {create as createTable, ITableLoader} from 'phovea_core/src/table_impl';
import {createLocalAssigner} from 'phovea_core/src/idtype';


function isNumeric(obj) {
  return (obj - parseFloat(obj) + 1) >= 0;
}

function guessValue(arr: IValueType[]): IValueTypeDesc {
  if (arr.length === 0) {
    return {type: 'string'}; //doesn't matter
  }
  const test = arr[0];
  if (typeof test === 'number' || isNumeric(test)) {
    return {type: VALUE_TYPE_REAL, range: d3extent(arr, parseFloat)};
  }
  const values = new Set(<string[]>arr);
  if (values.size < arr.length * 0.2 || values.size < 8) {
    //guess as categorical
    return {type: 'categorical', categories: Array.from(values.values())};
  }
  return {type: 'string'};
}


function createDefaultDataDesc(): IDataDescription {
  const id = uniqueString('localData');
  return {
    type: 'table',
    id: id,
    name: id,
    fqname: id,
    description: '',
    creator: 'Anonymous',
    ts: Date.now()
  };
}

export interface IParseMatrixOptions {
  name?: string;
  rowtype?: string;
  coltype?: string;
  rowassigner?(ids: string[]): Range;
  colassigner?(ids: string[]): Range;
}

function createDefaultMatrixDesc(): IMatrixDataDescription {
  return <IMatrixDataDescription>mixin(createDefaultDataDesc(), {
    rowtype: '_rows',
    coltype: '_cols',
    size: [0, 0]
  });
}


export function parseMatrix(data: IValueType[][]): IMatrix;
export function parseMatrix(data: IValueType[][], options?: IParseMatrixOptions): IMatrix;
export function parseMatrix(data: IValueType[][], rows: string[], cols: string[]): IMatrix;
export function parseMatrix(data: IValueType[][], rows: string[], cols: string[], options?: IParseMatrixOptions): IMatrix;


/**
 * parses a given dataset and convert is to a matrix
 * @param data the data array
 * @param rows_or_options see options or the row ids of this matrix
 * @param cols_def the optional column ids
 * @param options options for defining the dataset description
 * @returns {IMatrix}
 */
export function parseMatrix(data: IValueType[][], rows_or_options?: any, cols_def?: string[], options: IParseMatrixOptions = {}): IMatrix {
  const cols = cols_def ? cols_def : data.slice().shift().slice(1);
  const rows = Array.isArray(rows_or_options) ? <string[]>rows_or_options : data.map((r) => r[0]).slice(1);
  if (typeof rows_or_options === 'object') {
    options = rows_or_options;
  }
  options = options || {};

  let realData = Array.isArray(rows_or_options) ? data : data.map((r) => r.slice(1)).slice(1);

  const valueType = guessValue([].concat.apply([], realData));

  if (valueType.type === VALUE_TYPE_REAL) {
    realData = realData.map((row) => row.map(parseFloat));
  } else if (valueType.type === VALUE_TYPE_REAL) {
    realData = realData.map((row) => row.map(parseInt));
  }

  const desc = mixin(createDefaultMatrixDesc(), {
    size: [rows.length, cols.length],
    value: valueType
  }, options);

  const rowAssigner = options.rowassigner || createLocalAssigner();
  const colAssigner = options.rowassigner || createLocalAssigner();
  const loader: IMatrixLoader2 = {
    rowIds: (desc: IDataDescription, range: Range) => Promise.resolve(rowAssigner(range.filter(rows))),
    colIds: (desc: IDataDescription, range: Range) => Promise.resolve(colAssigner(range.filter(cols))),
    ids: (desc: IDataDescription, range: Range) => {
      const rc = rowAssigner(range.dim(0).filter(rows));
      const cc = colAssigner(range.dim(1).filter(cols));
      return Promise.resolve(join(rc, cc));
    },
    at: (desc: IDataDescription, i, j) => Promise.resolve(realData[i][j]),
    rows: (desc: IDataDescription, range: Range) => Promise.resolve(range.filter(rows)),
    cols: (desc: IDataDescription, range: Range) => Promise.resolve(range.filter(cols)),
    data: (desc: IDataDescription, range: Range) => Promise.resolve(range.filter(realData))
  };
  return createMatrix(desc, loader);
}

export function parseRemoteMatrix(url: string, options: any = {}): Promise<IMatrix> {
  return new Promise((resolve, reject) => {
    d3text(url, (error, data) => {
      if (error) {
        reject(error);
      }
      const rows = csv.parseRows(data);
      resolve(parseMatrix(rows, options));
    });
  });
}

function toObjects(data: any[][], cols: string[]) {
  return data.map((row) => {
    const r: any = {};
    cols.forEach((col, i) => r[col] = row[i]);
    return r;
  });
}
function toList(objs: any[], cols: string[]) {
  return objs.map((obj) => cols.map((c) => obj[c]));
}

export interface IParseTableOptions {
  name?: string;
  idtype?: string;
  rowassigner?(ids: string[]): Range;
  keyProperty?: string;
}


function createDefaultTableDesc(): ITableDataDescription {
  return <ITableDataDescription>mixin(createDefaultDataDesc(), {
    idtype: '_rows',
    columns: [],
    size: [0, 0]
  });
}


function asTableImpl(columns: ITableColumn[], rows: string[], objs: any[], data: IValueType[][], options: IParseTableOptions) {
  const desc = mixin(createDefaultTableDesc(), {
    columns: columns,
    size: [rows.length, columns.length]
  }, options);

  const rowAssigner = options.rowassigner || createLocalAssigner();
  const loader: ITableLoader = () => {
    const r = {
      rowIds: rowAssigner(rows),
      rows: rows,
      objs: objs,
      data: data
    };
    return Promise.resolve(r);
  };
  return createTable(desc, loader);
}

export function parseTable(data: any[][], options: IParseTableOptions = {}): ITable {
  const rows = data.map((r) => r[0]);
  const cols = data[0].slice(1);
  const tableData = data.slice(1).map((r) => r.slice(1));

  const columns = cols.map((col, i) => {
    return {
      name: col,
      value: guessValue(tableData.map((row) => row[i]))
    };
  });

  const realData = tableData.map((row) => columns.map((col, i) => (col.value.type === VALUE_TYPE_REAL || col.value.type === VALUE_TYPE_INT) ? parseFloat(row[i]) : row[i]));
  const objs = toObjects(realData, cols);

  return asTableImpl(columns, rows, objs, realData, options);
}

export function parseRemoteTable(url: string, options: IParseTableOptions = {}): Promise<ITable> {
  return new Promise((resolve, reject) => {
    csv(url, (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(parseObjects(data, options));
    });
  });
}

export function parseObjects(data: any[], options: IParseTableOptions = {}): ITable {
  const keyProperty = options.keyProperty || '_id';

  const rows = data.map((r, i) => String(r[keyProperty]) || String(i));
  const cols = Object.keys(data[0]);
  const objs = data;
  const realData = toList(objs, cols);

  const columns = cols.map((col, i) => {
    return {
      name: col,
      value: guessValue(realData.map((row) => row[i]))
    };
  });
  return asTableImpl(columns, rows, objs, realData, options);
}


