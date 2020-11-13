/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import * as d3 from 'd3';
export class ToolTip {
    static getTooltip() {
        let t = d3.select('body > div.phovea-tooltip');
        if (t.empty()) {
            t = d3.select('body').append('div')
                .attr('class', 'phovea-tooltip')
                .style('display', 'block')
                .style('opacity', 0);
        }
        return t;
    }
    /**
     * returns a D3 compatible call method, which registers itself to show a tooltip upon mouse enter
     * @param toLabel the text to show or a function to determine the text to show
     * @param delay delay before showing tooltip
     * @returns {Function}
     */
    static bind(toLabel, delay = 200) {
        //wrap as function
        const labelfor = d3.functor(toLabel);
        return function (selection) {
            selection.on('mouseenter.tooltip', function (d, i) {
                const tooltip = ToolTip.getTooltip();
                tooltip.html(labelfor.call(this, d, i))
                    .style('left', (d3.event.pageX + 5) + 'px')
                    .style('top', (d3.event.pageY - 28) + 'px');
                tooltip.style('display', 'block').interrupt().transition()
                    .delay(delay)
                    .duration(200)
                    .style('opacity', 0.9);
            })
                .on('mouseleave.tooltip', function () {
                const tooltip = ToolTip.getTooltip();
                tooltip.interrupt().transition()
                    .duration(200)
                    .style('opacity', 0)
                    .each('end', function () {
                    d3.select(this).style('display', 'none');
                });
            });
        };
    }
}
//# sourceMappingURL=ToolTip.js.map