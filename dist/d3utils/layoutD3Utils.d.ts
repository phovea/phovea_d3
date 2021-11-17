/**
 * Created by sam on 04.02.2015.
 */
import * as d3 from 'd3';
import { ILayoutElem, ALayoutElem, ILayoutOptions } from 'tdp_core';
import { Rect } from 'tdp_core';
export declare class SVGTransformLayoutElem extends ALayoutElem implements ILayoutElem {
    private readonly $elem;
    private rawWidth;
    private rawHeight;
    constructor($elem: d3.Selection<any>, rawWidth: number, rawHeight: number, options?: ILayoutOptions);
    setBounds(x: number, y: number, w: number, h: number): Promise<void> | null;
    getBounds(): Rect;
    static wrapSVGTransform($elem: d3.Selection<any>, rawWidth: number, rawHeight: number, options?: ILayoutOptions): SVGTransformLayoutElem;
}
export declare class SVGRectLayoutElem extends ALayoutElem implements ILayoutElem {
    private readonly $elem;
    constructor($elem: d3.Selection<any>, options?: ILayoutOptions);
    setBounds(x: number, y: number, w: number, h: number): Promise<void> | null;
    getBounds(): Rect;
    static wrapSVGRect($elem: d3.Selection<any>, options?: ILayoutOptions): SVGRectLayoutElem;
}
export interface IHTMLLayoutOptions extends ILayoutOptions {
    /**
     * unit to set
     * @default px
     */
    unit?: string;
    /**
     * use animation
     * @default false
     */
    animate?: boolean;
    /**
     * additional call
     * @param item
     */
    'set-call'?(item: d3.Selection<any>): void;
    /**
     * animation duration
     * @deprecated use animationDuration
     */
    'animation-duration'?: number;
    /**
     * @default 200
     */
    animationDuration?: number;
    /**
     * callback after everything is done
     */
    onSetBounds?(): void;
}
export declare class HTMLLayoutElem extends ALayoutElem implements ILayoutElem {
    private readonly $node;
    private targetBounds;
    constructor(node: HTMLElement, options?: IHTMLLayoutOptions);
    setBounds(x: number, y: number, w: number, h: number): Promise<any>;
    getBounds(): Rect;
    static wrapDom(elem: HTMLElement, options?: IHTMLLayoutOptions): HTMLLayoutElem;
}
