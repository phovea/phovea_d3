import { Range } from 'phovea_core';
import { IDType } from 'phovea_core';
interface IDontKnow {
    ids(): Promise<Range>;
    data: any;
    locate(): any;
}
interface IVisEntry {
    vis: IDontKnow;
    dim: number;
    id: number;
}
interface ILinksRendererEntry {
    idtype: IDType;
    l(): void;
    visses: IVisEntry[];
    push(vis: IDontKnow, dim: number): void;
    remove(vis: IDontKnow): void;
}
export declare class LinksRenderer {
    private readonly $parent;
    private readonly $div;
    private readonly $svg;
    private visses;
    private observing;
    constructor(parent: HTMLElement);
    register(idtype: IDType): ILinksRendererEntry;
    unregister(entry: ILinksRendererEntry): void;
    push(vis: any): void;
    remove(vis: any): void;
    update(idtype?: IDType): void;
    updateIDTypes(): void;
    static createLinksRenderer(parent: HTMLElement): LinksRenderer;
}
export {};
