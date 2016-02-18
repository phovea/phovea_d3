/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
/// <reference path="../../tsd.d.ts" />
import C = require('../caleydo_core/main');
import d3 = require('d3');
import datatypes = require('../caleydo_core/datatype');
import ranges = require('../caleydo_core/range');
import matrix = require('../caleydo_core/matrix');
import matrix_impl = require('../caleydo_core/matrix_impl');
import table = require('../caleydo_core/table');
import table_impl = require('../caleydo_core/table_impl');
import idtypes = require('../caleydo_core/idtype');
'use strict';

export function parseRemoteMatrix(url: string, options: any = {}): Promise<matrix.IMatrix> {
    return new Promise((resolve, reject) => {
        d3.text(url, (error, data)  => {
            if (error) {
                reject(error);
            }
            const rows = d3.csv.parseRows(data);
            resolve(parseMatrix(rows, options));
        });
    });
}

function isNumeric(obj) {
  return (obj - parseFloat(obj) + 1) >= 0;
}

function guessValue(arr: any[]) : any {
    if (arr.length === 0) {
        return { type: 'string'}; //doesn't matter
    }
    const test = arr[0];
    if (typeof test === 'number' || isNumeric(test)) {
        return { type: 'real', range: d3.extent(arr.map(parseFloat))};
    }
    const values = d3.set(arr);
    if (values.size() < arr.length * 0.2 || values.size() < 8) {
        //guess as categorical
        return { type: 'categorical', categories: values.values()};
    }
    return { type: 'string'};
}


export function parseMatrix(data:any[][]): matrix.IMatrix;
export function parseMatrix(data:any[][], options:any): matrix.IMatrix;
export function parseMatrix(data:any[][], rows: string[], cols: string[]): matrix.IMatrix;
export function parseMatrix(data:any[][], rows: string[], cols: string[], options:any): matrix.IMatrix;
/**
 * parses a given dataset and convert is to a matrix
 * @param data the data array
 * @param rows_or_options see options or the row ids of this matrix
 * @param cols_def the optional column ids
 * @param options options for defining the dataset description
 * @returns {matrix.IMatrix}
 */
export function parseMatrix(data:any[][], rows_or_options?: any, cols_def?: string[], options: any = {}): matrix.IMatrix {
    const rows = Array.isArray(rows_or_options) ? <string[]>rows_or_options : data.map((r) => r[0]);
    const cols = cols_def ? cols_def : data[0].slice(1);
    if (typeof rows_or_options === 'object') {
        options = rows_or_options;
    }
    options = options || {};

    const id = C.uniqueString('localData');
    var localdesc = {
        type: 'matrix',
        id: id,
        name: id,
        fqname: id,
        rowtype: '_rows',
        coltype: '_cols',
        rowassigner: idtypes.createLocalAssigner(),
        colassigner: idtypes.createLocalAssigner()
    };
    C.mixin(localdesc, options);


    const ddesc : any = localdesc;
    ddesc.size = ddesc.size || [rows.length, cols.length];
    var realdata = Array.isArray(rows_or_options) ? data : data.slice(1).map((r) => r.slice(1));
    ddesc.value = ddesc.value || guessValue([].concat.apply([],realdata));
    if (ddesc.value.type === 'real') {
        realdata = realdata.map((row) => row.map(parseFloat));
    }
    const loader = {
        rowIds: (desc:datatypes.IDataDescription, range:ranges.Range) => Promise.resolve(localdesc.rowassigner(range.filter(rows))),
        colIds: (desc:datatypes.IDataDescription, range:ranges.Range) => Promise.resolve(localdesc.rowassigner(range.filter(cols))),
        ids: (desc:datatypes.IDataDescription, range:ranges.Range) => {
            const rc = localdesc.rowassigner(range.dim(0).filter(rows));
            const cc = localdesc.colassigner(range.dim(1).filter(cols));
            return Promise.resolve(ranges.join(rc, cc));
        },
        at: (desc:datatypes.IDataDescription, i, j) => Promise.resolve(realdata[i][j]),
        rows: (desc:datatypes.IDataDescription, range:ranges.Range) => Promise.resolve(range.filter(rows)),
        cols: (desc:datatypes.IDataDescription, range:ranges.Range) => Promise.resolve(range.filter(cols)),
        data: (desc:datatypes.IDataDescription, range:ranges.Range) => Promise.resolve(range.filter(realdata))
    };

    return matrix_impl.create(<datatypes.IDataDescription>(<any>localdesc), loader);
}


export function parseRemoteTable(url: string, options: any = {}): Promise<table.ITable> {
    return new Promise((resolve, reject) => {
        d3.csv(url, (error, data)  => {
            if (error) {
                reject(error);
            }
            resolve(parseObjects(data, options));
        });
    });
}

function to_objects(data: any[][], cols: string[]) {
    return data.map((row) => {
        var r : any = {};
        cols.forEach((col,i) => r[col] = row[i]);
        return r;
    });
}

export function parseTable(data:any[][], options:any = {}): table.ITable {
    const id = C.uniqueString('localData');
    var localdesc = {
        type: 'table',
        id: id,
        name: id,
        fqname: id,
        idtype: '_rows',
        rowassigner: idtypes.createLocalAssigner()
    };
    C.mixin(localdesc, options);

    const rows = data.map((r) => r[0]);
    const cols = data[0].slice(1);
    var realdata = data.slice(1).map((r) => r.slice(1));
    const ddesc : any = localdesc;
    ddesc.size = ddesc.size || [rows.length, cols.length];

    ddesc.columns = ddesc.columns || cols.map((col, i) => {
      return {
          name: col,
          value : guessValue(realdata.map((row) => row[i]))
      };
    });
    realdata = realdata.map((row) => ddesc.columns.map((col, i) => (col.value.type === 'real') ? parseFloat(row[i]) : row[i]));
    const objs = to_objects(realdata, cols);

    ddesc.loader = (desc: datatypes.IDataDescription) => {
        const r = {
            rowIds: localdesc.rowassigner(rows),
            rows: rows,
            objs: objs,
            data: realdata
        };
        return Promise.resolve(r);
    };
    return table_impl.create(<any>localdesc);
}

function to_list(objs: any[], cols: string[]) {
    return objs.map((obj) => cols.map((c) => obj[c]));
}

export function parseObjects(data:any[], options:any = {}): table.ITable {
    const id = C.uniqueString('localData');
    var localdesc = {
        type: 'table',
        id: id,
        name: id,
        fqname: id,
        idtype: '_rows',
        rowassigner: idtypes.createLocalAssigner(),
        keyProperty: '_id'
    };
    C.mixin(localdesc, options);

    const rows = data.map((r,i) => r[localdesc.keyProperty] || i);
    const cols = Object.keys(data[0]);
    const objs = data;
    const realdata = to_list(objs, cols);

    const ddesc : any = localdesc;
    ddesc.dim = ddesc.dim || [rows.length, cols.length];

    ddesc.columns = ddesc.columns || cols.map((col, i) => {
      return {
          name: col,
          value : guessValue(realdata.map((row) => row[i]))
      };
    });

    ddesc.loader = (desc: datatypes.IDataDescription) => {
        const r = {
            rowIds: localdesc.rowassigner(rows),
            rows: rows,
            objs: objs,
            data: realdata
        };
        return Promise.resolve(r);
    };
    return table_impl.create(<any>localdesc);
}
