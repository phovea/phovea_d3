import { IAnyMatrix } from 'tdp_core';
import { IAsMatrixOptions } from 'tdp_core';
import { ITable } from 'tdp_core';
import { IAsTableOptions } from 'tdp_core';
export declare class RemoteParser {
    static parseRemoteMatrix(url: string, options?: IAsMatrixOptions): Promise<IAnyMatrix>;
    static parseRemoteTable(url: string, options?: IAsTableOptions): Promise<ITable>;
}
