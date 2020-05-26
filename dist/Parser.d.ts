import { IAnyMatrix } from 'phovea_core';
import { IAsMatrixOptions } from 'phovea_core';
import { ITable } from 'phovea_core';
import { IAsTableOptions } from 'phovea_core';
export declare class Parser {
    static parseRemoteMatrix(url: string, options?: IAsMatrixOptions): Promise<IAnyMatrix>;
    static parseRemoteTable(url: string, options?: IAsTableOptions): Promise<ITable>;
}
