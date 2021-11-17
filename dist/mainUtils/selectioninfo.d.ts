/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
import * as d3 from 'd3';
import { IDType } from 'tdp_core';
export interface ISelectionIDTypeOptions {
    /**
     * show the names instead of the ids
     * @default false
     */
    useNames?: boolean;
    /**
     * add clear button
     * @default true
     */
    addClear?: true;
    /**
     * selection types to show
     * @default select, hovered
     */
    selectionTypes?: string[];
    /**
     * filter function to filter selection types
     * @default constant true
     */
    filterSelectionTypes?(selectionType: string): boolean;
}
export declare class SelectionIDType {
    readonly idType: IDType;
    private readonly l;
    private readonly $div;
    private readonly $ul;
    private readonly options;
    constructor(idType: IDType, parent: d3.Selection<any>, options?: ISelectionIDTypeOptions);
    private update;
    destroy(): void;
    static createFor(idtype: IDType, parent: HTMLElement, options: ISelectionIDTypeOptions): SelectionIDType;
}
export interface ISelectionInfoOptions extends ISelectionIDTypeOptions {
    /**
     * filter function to filter idtypes
     * @default constant true
     */
    filter?(idtype: IDType): boolean;
}
/**
 * selection info shows a div for each id type and a list of all selected ids in it
 */
export declare class SelectionInfo {
    readonly parent: HTMLElement;
    private $div;
    private handler;
    private listener;
    private options;
    constructor(parent: HTMLElement, options?: ISelectionInfoOptions);
    private build;
    private destroy;
    static create(parent: HTMLElement, options?: ISelectionInfoOptions): SelectionInfo;
}
