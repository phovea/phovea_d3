/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
import {csv, text as d3text} from 'd3';
import {IAnyMatrix} from 'tdp_core';
import {Matrix, IAsMatrixOptions} from 'tdp_core';
import {ITable} from 'tdp_core';
import {Table, IAsTableOptions} from 'tdp_core';


export class RemoteParser {
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
