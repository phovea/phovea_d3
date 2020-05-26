import { IDataType } from 'phovea_core';
import * as d3 from 'd3';
export declare class D3Utils {
    static transform(x?: number, y?: number, rotate?: number, scaleX?: number, scaleY?: number): d3.Transform;
    /**
     * utility function to handle selections
     * @param data
     * @param $data
     * @param selector what type of object are the data bound ot
     * @returns {function(any, any): undefined} the click handler
     */
    static selectionUtil(data: IDataType, $data: d3.Selection<any>, selector: string): (d: any, i: number) => void;
    /**
     * utility function to define a vis
     * @param name the name of the vis - will be used during toString
     * @param defaultOptions a function or an object containing the default options of this vis
     * @param initialSize a function or the size to compute the initial size of this vis
     * @param build the builder function
     * @param functions an object of additional functions to the vis
     * @returns a function class for this vis
     */
    static defineVis(name: string, defaultOptions: any, initialSize: number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
    static defineVis(name: string, defaultOptions: (data: IDataType, options: any) => any, initialSize: number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
    static defineVis(name: string, defaultOptions: any, initialSize: (data: IDataType) => number[], build: ($parent: d3.Selection<any>, data: IDataType) => d3.Selection<any>, functions?: any): any;
    static defineVis(name: string, defaultOptions: (data: IDataType, options: any) => any, initialSize: (data: IDataType) => number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
}
