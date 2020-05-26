/**
 * Created by Samuel Gratzl on 16.12.2014.
 */
import { Rect, AShape } from 'phovea_core';
import { IEventHandler } from 'phovea_core';
import { IDType } from 'phovea_core';
import { Range, Range1D } from 'phovea_core';
import { IPluginDesc } from 'phovea_core';
import { ILocateAble } from 'phovea_core';
import * as d3 from 'd3';
export interface IDataVis extends IEventHandler, ILocateAble {
    readonly id: number;
    readonly location: AShape;
    readonly range: Range;
    ids(): Promise<Range>;
}
export interface IVisWrapper extends ILocateAble {
    readonly id: number;
    readonly location: AShape;
    dimOf(idtype: IDType): number;
    ids(): Promise<Range>;
}
export declare type IVisWrapperCallback = (v: VisWrapper) => void;
declare class VisWrapper implements IVisWrapper {
    private readonly v;
    private readonly dirtyEvents;
    readonly callbacks: IVisWrapperCallback[];
    private readonly lookup;
    private readonly l;
    /**
     * @param v the vis to wrap
     * @param dirtyEvents list of events when the vis is dirty
     */
    constructor(v: IDataVis, dirtyEvents: string[]);
    get vis(): IDataVis;
    get id(): number;
    get location(): AShape;
    dimOf(idtype: IDType): number;
    get data(): import("phovea_core").IDataType;
    ids(): Promise<Range>;
    get idtypes(): IDType[];
    locate(...range: Range[]): Promise<any>;
    locateById(...range: Range[]): Promise<any>;
    destroy(): void;
}
export interface ILink {
    readonly clazz: string;
    readonly id: string;
    readonly d: string;
    readonly range: Range;
}
export interface IBandContext {
    readonly line: d3.svg.Line<any>;
    readonly idtype: IDType;
    createBand(aBounds: Rect, bBounds: Rect, aIDs: Range1D, bIDs: Range1D, union: Range1D, id: string, clazz: string): ILink[];
}
export interface IBandRepresentation {
    (context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]>;
}
export interface ILinkOptions {
    /**
     * list of available representations
     */
    reprs?: IPluginDesc[];
    /**
     * @default false
     */
    animate?: boolean;
    /**
     * animation duration
     * @default 200
     */
    duration?: number;
    /**
     * should the user be able to click on the link
     * @default false
     */
    interactive?: boolean;
    /**
     * show hovered selections
     */
    hover?: boolean;
    /**
     * @default 1
     */
    mode?: number | string;
    /**
     * can the user currently select a link
     * @default constant true
     */
    canSelect?(): boolean;
    /**
     * can the user currently hover a link
     * @default constant false
     */
    canHover?(): boolean;
}
export interface ILinkIDTypeContainerOptions extends ILinkOptions {
    /**
     * should a link be shown between the given two
     * @default constant true
     * @param a
     * @param b
     */
    filter?(a: IDataVis, b: IDataVis): boolean;
}
export interface ILinkContainerOptions extends ILinkOptions, ILinkIDTypeContainerOptions {
    /**
     * @default constant true
     * @param idtype
     * @param i
     * @param dataVis
     */
    idTypeFilter?(idtype: IDType, i: number, dataVis: IDataVis): boolean;
}
export declare class LinkContainer {
    private readonly dirtyEvents;
    private arr;
    node: any;
    private links;
    private options;
    constructor(parent: Element, dirtyEvents: string[], options?: ILinkContainerOptions);
    hide(): void;
    show(): void;
    update(): void;
    push(update: boolean, ...elems: IDataVis[]): void;
    push(elem: IDataVis, ...elems: IDataVis[]): void;
    remove(update: boolean, elem: IDataVis): boolean;
    remove(elem: IDataVis): boolean;
    clear(): void;
    private destroy;
}
export {};
