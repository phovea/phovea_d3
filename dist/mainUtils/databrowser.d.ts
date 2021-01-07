/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
/// <reference types="d3" />
import { EventHandler } from 'phovea_core';
import { IDataType } from 'phovea_core';
export interface IDropDataItemHandlerOptions {
    /**
     * data types (matrix, vector, ...) to filter
     * @default [] = all
     */
    types?: string[];
}
export declare type IDropHandler = (d: IDataType, op: string, pos: {
    x: number;
    y: number;
}) => void;
export declare class DropDataItemHandler extends EventHandler {
    private handler?;
    private options;
    constructor(elem: Element, handler?: IDropHandler, options?: IDropDataItemHandlerOptions);
    private checkType;
    private register;
    static makeDropable(elem: Element, onDrop?: IDropHandler, options?: IDropDataItemHandlerOptions): DropDataItemHandler;
    static makeDraggable<T>(sel: d3.Selection<T>, dataGetter?: (d: T) => IDataType): void;
}
export interface IDataBrowserOptions {
    /**
     * layout: 'tree' or 'list'
     * @default tree
     */
    layout?: string;
    /**
     * should items be draggable
     * @default true
     */
    draggable?: boolean;
    /**
     * optional filter to filter the datasets
     */
    filter?: ({
        [key: string]: string;
    }) | ((d: IDataType) => boolean);
}
export declare class DataBrowser extends EventHandler {
    private options;
    private $node;
    constructor(parent: Element, options?: IDataBrowserOptions);
    private build;
    private buildTree;
    private buildList;
    static createDataBrowser(parent: HTMLElement, options?: IDataBrowserOptions): DataBrowser;
}
