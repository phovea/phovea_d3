/**
 * Created by sam on 16.02.2015.
 */
import { IBandContext, IVisWrapper, ILink } from './link';
import { AShape, Rect } from 'phovea_core';
export declare class LinkRepresentation {
    static createBlockRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]>;
    static toArray(a: any): any[];
    static createGroupRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]>;
    selectCorners(a: AShape, b: AShape): string[];
    static createItemRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]>;
}
