/**
 * Created by Samuel Gratzl on 24.10.2015.
 */
import { csv, text as d3text } from 'd3';
import { Matrix } from 'phovea_core';
import { Table } from 'phovea_core';
export class RemoteParser {
    static parseRemoteMatrix(url, options = {}) {
        return new Promise((resolve, reject) => {
            d3text(url, (error, data) => {
                if (error) {
                    reject(error);
                }
                const rows = csv.parseRows(data);
                resolve(Matrix.asMatrix(rows, options));
            });
        });
    }
    static parseRemoteTable(url, options = {}) {
        return new Promise((resolve, reject) => {
            csv(url, (error, data) => {
                if (error) {
                    reject(error);
                }
                resolve(Table.asTable(data, options));
            });
        });
    }
}
//# sourceMappingURL=RemoteParser.js.map