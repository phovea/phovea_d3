/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
import {csv, text as d3text} from 'd3';
import {IAnyMatrix} from 'phovea_core';
import {Matrix, IAsMatrixOptions} from 'phovea_core';
import {ITable} from 'phovea_core';
import {Table, IAsTableOptions} from 'phovea_core';


export class Parser {
  static parseRemoteMatrix(url: string, options: IAsMatrixOptions = {}): Promise<IAnyMatrix> {
    return new Promise((resolve, reject) => {
      d3text(url, (error: string, data: any) => {
        if (error) {
          reject(error);
        }
        const rows = csv.parseRows(data);
        resolve(Matrix.asMatrix(rows, options));
      });
    });
  }

  static parseRemoteTable(url: string, options: IAsTableOptions = {}): Promise<ITable> {
    return new Promise((resolve, reject) => {
      csv(url, (error: string, data: any) => {
        if (error) {
          reject(error);
        }
        resolve(Table.asTable(data, options));
      });
    });
  }
}
