/**
 * Created by Samuel Gratzl on 08.10.2014.
 */
import {onDOMNodeRemoved, extendClass, mixin} from 'phovea_core/src';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {IDataType} from 'phovea_core/src/datatype';
import {Range} from 'phovea_core/src/range';
import {AVisInstance} from 'phovea_core/src/vis';
import {wrap} from 'phovea_core/src/geom';
import * as d3 from 'd3';

export function transform(x = 0, y = 0, rotate = 0, scaleX = 1, scaleY = 1) {
  const t = d3.transform('');
  t.translate = [x, y];
  t.rotate = rotate;
  t.scale = [scaleX, scaleY];
  return t;
}
/**
 * utility function to handle selections
 * @param data
 * @param $data
 * @param selector what type of object are the data bound ot
 * @returns {function(any, any): undefined} the click handler
 */
export function selectionUtil(data: IDataType, $data: d3.Selection<any>, selector: string) {
  const l = function (event: any, type: string, selected: Range) {
    const all = $data.selectAll(selector);
    all.classed('phovea-select-' + type, false);
    const sub = selected.filter(all[0]);
    if (sub.length > 0) {
      d3.selectAll(sub).classed('phovea-select-' + type, true);
    }
  };
  data.on('select', l);
  onDOMNodeRemoved(<Element>$data.node(), function () {
    data.off('select', l);
  });
  data.selections().then(function (selected) {
    l(null, 'selected', selected);
  });

  return (d: any, i: number) => {
    data.select(0, [i], toSelectOperation(<MouseEvent>d3.event));
  };
}

/**
 * utility function to define a vis
 * @param name the name of the vis - will be used during toString
 * @param defaultOptions a function or an object containing the default options of this vis
 * @param initialSize a function or the size to compute the initial size of this vis
 * @param build the builder function
 * @param functions an object of additional functions to the vis
 * @returns a function class for this vis
 */
export function defineVis(name: string, defaultOptions: any, initialSize: number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
export function defineVis(name: string, defaultOptions: (data: IDataType, options: any) => any, initialSize: number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
export function defineVis(name: string, defaultOptions: any, initialSize: (data: IDataType) => number[], build: ($parent: d3.Selection<any>, data: IDataType) => d3.Selection<any>, functions?: any): any;
export function defineVis(name: string, defaultOptions: (data: IDataType, options: any) => any, initialSize: (data: IDataType) => number[], build: ($parent: d3.Selection<any>, data: IDataType, size: number[]) => d3.Selection<any>, functions?: any): any;
export function defineVis(name: string, defaultOptions: any, initialSize: any, build: ($parent: d3.Selection<any>, data?: IDataType, size?: number[]) => d3.Selection<any>, functions?: any): any {
  extendClass(VisTechnique, AVisInstance);
  function VisTechnique(this: any, data: IDataType, parent: Element, options: any) {
    AVisInstance.call(this, data, parent, options);
    this.data = data;
    this.name = name;
    this.$parent = d3.select(parent);
    this.initialSize = d3.functor(initialSize);
    this.options = mixin({}, d3.functor(defaultOptions).call(this, data, options || {}), options);
    if (typeof(this.init) === 'function') {
      this.init(data);
    }
    this.$node = build.call(this, this.$parent, this.data, this.size);
    this.$node.datum(data);
    this.$node.node().__vis__ = this;
  }

  VisTechnique.prototype.toString = () => name;
  VisTechnique.prototype.option = function (this: any, name: string, value: any) {
    if (arguments.length === 1) {
      return this.options[name];
    } else {
      const b = this.options[name];
      if (b === value) { // no change
        return b;
      }
      this.fire('option', name, value, b);
      this.fire('option.' + name, value, b);
      this.options[name] = value;
      this.updatedOption(name, value);
      return b;
    }
  };
  VisTechnique.prototype.updatedOption = function (name: string, value: any) {
    //dummy
  };
  VisTechnique.prototype.transform = function (this: any, scale: [number, number], rotate: number) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const size = this.rawSize;
    if ((<Element>this.node).tagName.toLowerCase() === 'svg') {
      this.$node.attr({
        width: size[0] * scale[0],
        height: size[1] * scale[1]
      }).style('transform', 'rotate(' + rotate + 'deg)');
      this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
    } else {
      this.$node.style('transform', `rotate(${rotate}deg)scale(${scale[0]},${scale[1]})`);
    }

    const act = {
      scale,
      rotate
    };
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  };
  VisTechnique.prototype.locateImpl = function (this: any, range: Range) {
    const r = this.locateIt(range);
    if (!r) {
      return null;
    }
    return r.then((shape: any) => {
      shape = wrap(shape);
      return shape ? shape.transform(this.options.scale || [1, 1], this.options.rotate || 0) : shape;
    });
  };
  VisTechnique.prototype.locateIt = function (): null {
    return null;
  };
  Object.defineProperty(VisTechnique.prototype, 'node', {
    get(this: any) {
      return this.$node.node();
    },
    enumerable: true
  });
  Object.defineProperty(VisTechnique.prototype, 'rawSize', {
    get(this: any) {
      return this.initialSize(this.data);
    },
    enumerable: true
  });
  Object.keys(functions || {}).forEach((f) => {
    VisTechnique.prototype[f] = functions[f];
  });
  return VisTechnique;
}
