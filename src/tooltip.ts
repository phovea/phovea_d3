/**
 * Created by Samuel Gratzl on 05.08.2014.
 */

import './style.scss';
import * as d3 from 'd3';


function getTooltip() {
  var t = d3.select('body > div.phovea-tooltip');
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
 * @returns {Function}
 */
export default function bind<T>(toLabel:((d:T, i:number)=>string) | string, delay = 200) {
  //wrap as function
  const labelfor:((d:T, i:number)=>string) = <any>d3.functor(toLabel);

  return function (selection:d3.Selection<T>) {
    selection.on('mouseenter.tooltip', function (d:T, i) {
        const tooltip = getTooltip();
        tooltip.html(labelfor.call(this, d, i))
          .style('left', ((<MouseEvent>d3.event).pageX + 5) + 'px')
          .style('top', ((<MouseEvent>d3.event).pageY - 28) + 'px');
        tooltip.style('display', 'block').interrupt().transition()
          .delay(delay)
          .duration(200)
          .style('opacity', 0.9);
      })
      .on('mouseleave.tooltip', function () {
        const tooltip = getTooltip();
        tooltip.interrupt().transition()
          .duration(200)
          .style('opacity', 0)
          .each('end', function () {
            d3.select(this).style('display', 'none');
          });
      });
  };
}
