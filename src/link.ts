/**
 * Created by Samuel Gratzl on 16.12.2014.
 */

import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {Rect, polygon, AShape} from 'phovea_core/src/geom';
import {Vector2D} from 'phovea_core/src/2D';
import {IEventHandler} from 'phovea_core/src/event';
import {IDType, defaultSelectionType, hoverSelectionType, toSelectOperation} from 'phovea_core/src/idtype';
import {Range, Range1D, list as rlist} from 'phovea_core/src/range';
import {list as listPlugins} from 'phovea_core/src/plugin';
import {ILocateAble, } from 'phovea_core/src/vis';
import * as d3 from 'd3';

export interface IDataVis extends IEventHandler, ILocateAble {
  id: number;
  location : AShape;
  range: Range;
  ids() : Promise<Range>;
}

export interface IVisWrapper extends ILocateAble {
  id: number;
  location: AShape;
  dimOf(idtype:IDType) : number;
  ids() : Promise<Range>;
}

class VisWrapper implements IVisWrapper {
  callbacks : Array<(v : VisWrapper) => void> = [];
  private lookup: d3.Map<number> = d3.map<number>();

  private l = () => {
    this.callbacks.forEach((c) => c(this));
  };

  constructor(private v : IDataVis, private dirtyEvents : string[]) {
    this.dirtyEvents.forEach((event) => v.on(event, this.l));
    this.v.data.idtypes.forEach((idtype, i) => {
      this.lookup.set(idtype.id, i);
    });
  }

  get vis() {
    return this.v;
  }

  get id() {
    return this.v.id;
  }

  get location() {
    return this.v.location;
  }

  dimOf(idtype : IDType) {
    if (!this.lookup.has(idtype.id)) {
      return -1;
    }
    return this.lookup.get(idtype.id);
  }

  get data() {
    return this.v.data;
  }

  ids() {
    return this.v.ids();
  }

  get idtypes() {
    return this.data.idtypes;
  }

  locate(...range: Range[]): Promise<any> {
    return this.v.locate.apply(this.vis, range);
  }
  locateById(...range: Range[]): Promise<any> {
    return this.v.locateById.apply(this.vis, range);
  }

  destroy() {
    this.dirtyEvents.forEach((event) => this.v.off(event, this.l));
  }
}



function toId(a,b) {
  a = typeof a === 'number' ? a : a.id;
  b = typeof b === 'number' ? b : b.id;
  return Math.min(a,b)+'-'+Math.max(a,b);
}


export interface ILink {
  clazz : string;
  id : string;
  d : string;
  range: Range;
}

export interface IBandContext {
  line: d3.svg.Line<any>;
  idtype: IDType;
  createBand(aBounds: Rect, bBounds: Rect, aIDs: Range1D, bIDs: Range1D, union: Range1D, id: string, clazz : string) : ILink[];
}

export interface IBandRepresentation {
  (context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]>;
}


var lineGlobal = d3.svg.line<Vector2D>().interpolate('linear-closed').x((d)=>d.x).y((d)=>d.y);

class Link {
  id : string;
  constructor(public a : VisWrapper, public b: VisWrapper, private idtype : IDType, private all: VisWrapper[], private options : any) {
    this.id = toId(a, b);
  }

  update($g : d3.Selection<any>): Promise<void> {
    var a = this.a,
      b = this.b,
      al = a.location.aabb(),
      bl = b.location.aabb(),
      tmp;
    if (bl.x2 < (al.x - 10)) {
      //swap
      tmp = b;
      b = a;
      a = tmp;
      tmp = bl;
      bl = al;
      al = tmp;
    }
    if (this.options.animate) {
      $g.transition().duration(this.options.duration).style('opacity', 0);
    }
    if (!this.shouldRender(a, al, b, bl)) {
      this.render([], $g);
      if (this.options.animate) {
        $g.transition().duration(this.options.duration).style('opacity', 1);
      }
      return;
    }
    var f = this.options.reprs[Math.abs(this.mode($g))-1]
      .load()
      .then((plugin) => plugin.factory(this, a, al, b, bl));
    return f.then((llinks) => {
      if (this.options.interactive !== false) {
        llinks.unshift({ //add a background
          clazz: 'rel-back',
          d: lineGlobal.interpolate('linear-closed')([al.corner('ne'), bl.corner('nw'), bl.corner('sw'), al.corner('se')]),
          id: 'background'
        });
      }
      this.render(llinks, $g);
      if (this.options.animate) {
        $g.transition().duration(this.options.duration).style('opacity', 1);
      }
      return null;
    });
  }

  get line() {
    return lineGlobal;
  }

  createBand(aa: Rect, bb: Rect, ida: Range1D, idb: Range1D, union: Range1D, id: string, clazz : string) {
    var ul = union.length;

    var l : Vector2D[] = [aa.corner('ne'), bb.corner('nw')];

    var r = [];
    function addBlock(ar, br, id, clazz, ashift, bshift) {
      var ll = l.slice();
      //compute the edge vector and scale it by the ratio
      var a_dir = Vector2D.fromPoints(l[0], aa.corner('se'));
      var b_dir = Vector2D.fromPoints(l[1], bb.corner('sw'));
      ll.push(l[1].add(b_dir.multiply(br)));
      ll.push(l[0].add(a_dir.multiply(ar)));
      if (ashift > 0) {
        ll[0].addEquals(a_dir.multiplyEquals(ashift));
      }
      if (bshift > 0) {
        ll[1].addEquals(b_dir.multiplyEquals(bshift));
      }
      r.push({
        clazz: clazz,
        d: lineGlobal.interpolate('linear-closed')(ll),
        id: id,
        range: rlist(union)
      });
    }

    //create a selection overlay
    var s = this.idtype.selections().dim(0);
    var selected = !s.isNone ? union.intersect(s).length : 0;
    if (selected > 0) {
      addBlock(selected / ida.length, selected / idb.length, id + '-sel', clazz + ' phovea-select-'+defaultSelectionType, 0, 0);
    }
    addBlock(ul / ida.length, ul / idb.length, id, clazz, selected / ida.length, selected / idb.length);

    if (this.options.hover) {
      s = this.idtype.selections(hoverSelectionType).dim(0);
      let hovered = !s.isNone ? union.intersect(s).length : 0;
      if (hovered > 0) {
        addBlock(hovered / ida.length, hovered / idb.length, id + '-sel', clazz + ' phovea-select-'+hoverSelectionType, 0, 0);
      }
    }

    //console.error('created band');
    return r;
  }

  private shouldRender(a: VisWrapper, aa: Rect, b: VisWrapper, bb: Rect) {
    if (aa.x2 < (bb.x - 10)) {
      //nothing to do
    } else {
      return false;
    }
    var shape = polygon(aa.corner('ne'), bb.corner('nw'), bb.corner('sw'), aa.corner('se'));
    //check if we have an intersection
    return this.all.every((other) => {
      if (other === this.a || other === this.b) { //don't check me
        return true;
      }
      var o = other.location;
      var int = shape.intersects(o);
      return !int.intersects;
    });
  }

  mode($g: d3.Selection<any>) : number {
    var m = +$g.attr('data-mode');
    if (m) {
      return m;
    }
    m = this.options.mode || 1;
    if (typeof m === 'string') {
      m = 1 + this.options.reprs.findIndex((c: any) => c.id === m);
    }
    return m;
  }

  setMode($g: d3.Selection<any>, value: number) {
    $g.attr('data-mode', value);
    this.update($g);
  }

  private nextMode($g: d3.Selection<any>) {
    var mode = this.mode($g),
      l = this.options.reprs.length;
    if( l === 1) {
      return;
    }
    if (mode > 0) {
      mode = mode === l.length ? -mode+1 : mode+1;
    } else if (mode < 0) {
      mode = mode === -1 ? -mode+1 : mode+1;
    }
    this.setMode($g, mode);
  }

  private render(links : ILink[], $g: d3.Selection<any>) {
    const $links = $g.selectAll('path').data(links, (d) => d.id);
    const $links_enter = $links.enter().append('path').on('click', (link) => {
      let e = <Event>d3.event;
      if (link.range && this.options.canSelect()) {
        this.idtype.select(link.range, toSelectOperation(d3.event));
      }
      e.preventDefault();
      e.stopPropagation();
    });
    if (this.options.hover) {
      $links_enter.on('mouseenter', (link) => {
        let e = <Event>d3.event;
        if (link.range && this.options.canHover()) {
        this.idtype.select(hoverSelectionType, link.range);
        }
        e.preventDefault();
        e.stopPropagation();
      }).on('mouseleave', (link) => {
        let e = <Event>d3.event;
        if (link.range && this.options.canHover()) {
          this.idtype.clear(hoverSelectionType);
        }
        e.preventDefault();
        e.stopPropagation();
      });
    }

    $links.exit().remove();
    $links.attr({
      'class' : (d) => d.clazz,
      d: (d) => d.d
    });
    if (this.options.interactive !== false) {
      $g.select('path.rel-back').on('contextmenu', () => {
        let e = <Event>d3.event;
        this.nextMode($g);
        e.preventDefault();
      });
    }
  }

}

class LinkIDTypeContainer {
  private listener = (event, type:string, selected: Range, added: Range, removed: Range) => this.selectionUpdate(type, selected, added, removed);
  private change = (elem: VisWrapper) => this.changed(elem);
  private arr : VisWrapper[] = [];
  private $node : d3.Selection<any>;

  constructor(public idtype: IDType, private parent: Element, private options: any = {}) {
    idtype.on('select', this.listener);
    this.$node = d3.select(parent).append('svg');
    this.$node.style({
      left: '0px',
      top: '0px',
      opacity: 1
    });
    this.$node.append('g');
    onDOMNodeRemoved(<Element>this.$node.node(), this.destroy, this);
  }

  private selectionUpdate(type:string, selected: Range, added: Range, removed: Range) {
    //TODO
    this.renderAll();
  }

  hide() {
    this.$node.select('g').selectAll('g').transition().duration(this.options.duration).style('opacity',0);
  }
  show() {
    this.$node.select('g').selectAll('g').transition().duration(this.options.duration).style('opacity',1);
  }

  private changed(elem: VisWrapper) {
    if (this.arr.length > 1) {
      this.render(elem);
    }
  }

  private moveSVG() {
    var l = this.arr[0].location.aabb();
    this.arr.forEach((a) => {
      var b = a.location.aabb(), d = 0;
      if (b.x < l.x) {
        d = l.x - b.x;
        l.x -= d;
        l.w += d;
      }
      if (b.x2 > l.x2) {
        l.x2 = b.x2;
      }
      if (b.y < l.y) {
        d = l.y - b.y;
        l.y -= d;
        l.h += d;
      }
      if (b.y2 > l.y2) {
        l.y2 = b.y2;
      }
    });
    this.$node.attr({
      width: l.w,
      height: l.h
    });
    this.$node.style({
      left: l.x + 'px',
      top : l.y + 'px'
    });
    this.$node.select('g').attr('transform', 'translate(' + (-l.x) + ',' + (-l.y) + ')');
  }



  private prepareCombinations() {
    var $root = this.$node.select('g');
    var combinations = [];
    var l = this.arr.length, i, j, a,b,
      filter = this.options.filter || (()=>true);
    for (i = 0; i < l; ++i) {
      a = this.arr[i];
      for (j = 0; j < i; ++j) {
        b = this.arr[j];
        if (filter(a.vis, b.vis)) {
          combinations.push(new Link(a, b, this.idtype, this.arr, this.options));
        }
      }
    }
    var $combi = $root.selectAll('g').data(combinations, (l) => l.id);
    $combi.enter().append('g').attr('data-id', (l) => l.id).style('opacity',this.options.animate ? 0 : 1);
    if (this.options.animate) {
      $combi.exit().transition().duration(this.options.duration).style('opacity', 0).remove();
    } else {
      $combi.exit().remove();
    }
  }

  update() {
    //move the svg to just the bounding box
    this.moveSVG();
    this.prepareCombinations();
    return this.renderAll();
  }

  private renderAll() {
    var $root = this.$node.select('g');
    var i , j, ai, aj, l = this.arr.length;
    var promises = [];
    for(i = 0; i < l ; ++i) {
      ai = this.arr[i];
      for(j = 1; j < l; ++j) {
        aj = this.arr[j];
        var id = toId(ai, aj);
        var $g = $root.select('g[data-id="' + id + '"]');
        $g.each(function(link) {
          promises.push(link.update(d3.select(this)));
        });
      }
    }
    return Promise.all(promises);
  }

  private render(elem: VisWrapper) {
    //move the svg to just the bounding box
    this.moveSVG();
    this.prepareCombinations();
    var $root = this.$node.select('g');

    var promises = [];
    this.arr.forEach((o) => {
      if (o !== elem) {
        var id = toId(o, elem);
        $root.select('g[data-id="' + id + '"]').each(function(link) {
          promises.push(link.update(d3.select(this)));
        });
      }
    });
    return Promise.all(promises);
  }

  private destroy() {
    this.idtype.off('select', this.listener);
  }

  push(elem: VisWrapper, triggerUpdate = true) {
    const idtypes = elem.idtypes;
    if (idtypes.indexOf(this.idtype) >= 0) {
      this.arr.push(elem);
      elem.callbacks.push(this.change);
      if (this.arr.length > 1 && triggerUpdate) {
        this.render(elem);
      }
    }
  }
  remove(elem: VisWrapper, triggerUpdate = true) {
    var index = this.arr.indexOf(elem);
    if (index >= 0) {
      this.arr.splice(index, 1);
      elem.callbacks.splice(elem.callbacks.indexOf(this.change), 1);
      this.prepareCombinations();
    }
    if (this.arr.length === 0) { //destroy myself if nothing left
      this.$node.remove();
    }
    return this.arr.length > 0;
  }

}

function constantTrue() {
  return true;
}

export class LinkContainer {
  private arr : VisWrapper[] = [];
  node = document.createElement('div');

  private links : LinkIDTypeContainer[] = [];

  private options = {
    reprs : listPlugins('link-representation').sort((a: any, b: any) => b.granularity - a.granularity),
    animate: true,
    duration: 100,
    filter: constantTrue,
    idTypeFilter : <(idtype: IDType, i: number, dataVis: IDataVis) => boolean>constantTrue,
    hover : false,
    canSelect : constantTrue,
    canHover: ()=>false
  };

  constructor(private parent: Element, private dirtyEvents: string[], options : any = {}) {
    parent.appendChild(this.node);
    this.node.classList.add('link-container');
    onDOMNodeRemoved(this.node, this.destroy, this);
    mixin(this.options, options);
  }

  hide() {
    this.links.forEach((l) => l.hide());
  }
  show() {
    this.links.forEach((l) => l.show());
  }

  update() {
    this.links.forEach((l) => l.update());
  }

  push(update: boolean, ...elems : IDataVis[]);
  push(elem: IDataVis, ...elems : IDataVis[]);
  push(arg: any, ...elems: IDataVis[]) {
    var triggerUpdate = arg !== false;
    if (typeof arg !== 'boolean') {
      elems.unshift(<IDataVis>arg);
    }
    var idTypeFilter = this.options.idTypeFilter;
    elems.forEach((elem) => {
      var w = new VisWrapper(elem, this.dirtyEvents);
      this.arr.push(w);
      var idtypes = w.idtypes.filter((idtype, i) => idTypeFilter(idtype, i, elem));
      //update all links
      this.links.forEach((l) => {
        l.push(w, triggerUpdate);
        var index = idtypes.indexOf(l.idtype);
        if (index >= 0) {
          idtypes.splice(index, 1);
        }
      });
      //add missing idtypes
      idtypes.forEach((idtype) => {
        var n = new LinkIDTypeContainer(idtype, this.node, this.options);
        n.push(w, triggerUpdate);
        this.links.push(n);
      });
    });
  }

  remove(update: boolean, elem: IDataVis);
  remove(elem: IDataVis);
  remove(arg : any, elem?: IDataVis) {
    var triggerUpdate = arg !== false;
    if (typeof arg !== 'boolean') {
      elem = <IDataVis>arg;
    }
    var index = this.arr.findIndex((w) => w.vis === elem);
    if (index < 0) {
      return false;
    }
    var w = this.arr[index];
    w.destroy();
    this.links = this.links.filter((l) => l.remove(w, triggerUpdate));
    this.arr.splice(index, 1);
    return true;
  }

  clear() {
    this.arr.forEach((a) => a.destroy());
    this.links = [];
    this.arr = [];
  }

  private destroy() {
    this.node.parentElement.removeChild(this.node);
    this.arr.forEach(VisWrapper.prototype.destroy.call);
  }
}


