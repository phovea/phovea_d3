/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import '../scss/main.scss';
import * as d3 from 'd3';
export declare class ToolTip {
    static getTooltip(): d3.Selection<any>;
    /**
     * returns a D3 compatible call method, which registers itself to show a tooltip upon mouse enter
     * @param toLabel the text to show or a function to determine the text to show
     * @param delay delay before showing tooltip
     * @returns {Function}
     */
    static bind<T>(toLabel: ((d: T, i: number) => string) | string, delay?: number): (selection: d3.Selection<T>) => void;
}
