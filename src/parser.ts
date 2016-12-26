/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
import {csv, text as d3text} from 'd3';
import {IMatrix} from 'phovea_core/src/matrix';
import {asMatrix, IAsMatrixOptions} from 'phovea_core/src/matrix_impl';
import {ITable} from 'phovea_core/src/table';
import {asTable as parseObjects, IAsTableOptions} from 'phovea_core/src/table_impl';

export {asMatrix as parseMatrix} from 'phovea_core/src/matrix_impl';
export {asTable as parseObjects, asTableFromArray as parseTable} from 'phovea_core/src/table_impl';

export function parseRemoteMatrix(url: string, options: IAsMatrixOptions = {}): Promise<IMatrix> {
  return new Promise((resolve, reject) => {
    d3text(url, (error, data) => {
      if (error) {
        reject(error);
      }
      const rows = csv.parseRows(data);
      resolve(asMatrix(rows, options));
    });
  });
}

export function parseRemoteTable(url: string, options: IAsTableOptions = {}): Promise<ITable> {
  return new Promise((resolve, reject) => {
    csv(url, (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(parseObjects(data, options));
    });
  });
}

