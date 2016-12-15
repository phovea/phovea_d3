/**
 * Created by Samuel Gratzl on 15.12.2014.
 */

import './style.scss';
import * as d3 from 'd3';
import {hasDnDType,updateDropEffect, mixin} from 'phovea_core/src';
import {list as listData, tree as treeData, get as getData} from 'phovea_core/src/data';
import {EventHandler} from 'phovea_core/src/event';
import {IDataType} from 'phovea_core/src/datatype';

export class DataBrowser extends EventHandler {
  private $node:d3.Selection<any>;

  constructor(private parent:Element, private options:any = {}) {
    super();
    this.options = mixin({
      layout: 'tree',
      draggable: true,
      filter: ()=>true
    }, options);

    this.$node = this.build(parent);
  }

  private build(parent:Element): d3.Selection<any> {
    if (this.options.layout === 'tree') {
      return this.buildTree(parent);
    } else if (this.options.layout === 'list') {
      return this.buildList(parent);
    }
    return d3.select(parent);
  }

  private buildTree(parent: Element) {
    const $node = d3.select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
    const that = this;

    function buildLevel($level) {
      var $childs = $level.selectAll('li').data((d) => d.children);
      var $childs_enter = $childs.enter().append('li').classed('collapsed', true);

      var $label = $childs_enter.append('span')
        .on('click', function (d) {
          if (d.children.length > 0) {
            var $parent = d3.select(this.parentNode);
            var collapse = !$parent.classed('collapsed');
            $parent.classed('collapsed', collapse);
            that.fire('toggleCollapse', d, collapse);
            $parent.select('i').classed('fa-chevron-down', !collapse).classed('fa-chevron-right', collapse);
          } else {
            that.fire('select', d.data);
          }
        })
        .call(makeDraggable, (d) => d.data);

      $label.append('i').attr('class', 'fa-li fa');
      $label.append('span');
      $childs_enter.append('ul').classed('fa-ul', true);
      $childs.select('i')
        .classed('fa-chevron-right', (d) => d.children.length > 0)
        .classed('fa-file-o', (d) => d.children.length === 0);

      $childs.select('span').attr('draggable', (d) => d.data !== null && that.options.draggable);
      $childs.select('span span').text((d) => {
        var r = d.name;
        if (d.children.length > 0) {
          r = r + ` (${d.children.length})`;
        }
        if (d.data !== null) {
          r = r + ` [${d.data.dim.join(',')}]`;
        }
        return r;
      });
      $childs.each(function (d) {
        if (d.children.length > 0) {
          buildLevel(d3.select(this).select('ul'));
        }
      });
      $childs.exit().remove();
    }

    treeData(this.options.filter).then((root) => {
      $node.datum(root);
      buildLevel($node);
    });

    return $node;
  }

  private buildList(parent: Element) {
    const $node = d3.select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
    listData(this.options.filter).then((list: IDataType[]) => {
      const $li = $node.selectAll('li').data(list);
      const $li_enter = $li.enter().append('li').append('span')
        .call(makeDraggable);
      $li_enter.append('i').attr('class','fa-li fa fa-file-o');
      $li_enter.append('span');
      $li.select('span span')
        .text((d) => d.desc.name);
      $li.exit().remove();
    });

    return $node;
  }
}

export class DropDataItemHandler extends EventHandler {
  private options = {
    types: []
  };

  constructor(elem:Element, private handler?:(d:IDataType, op:string, pos:{ x: number, y : number}) => void, options = {}) {
    super();
    mixin(this.options, options);
    this.register(d3.select(elem));
  }

  private checkType(e: any) {
    if (this.options.types.length === 0) {
      return hasDnDType(e, 'application/phovea-data-item');
    }
    return this.options.types.some((t) => hasDnDType(e, 'application/phovea-data-'+t));
  }

  private register($node:d3.Selection<any>) {
    $node.on('dragenter', () => {
      var e = <Event>d3.event;
      var xy = d3.mouse($node.node());
      if (this.checkType(e)) {
        e.preventDefault();
        this.fire('enter', {x: xy[0], y: xy[1]});
        return false;
      }
    }).on('dragover', () => {
      var e = <Event>d3.event;
      var xy = d3.mouse($node.node());
      if (this.checkType(e)) {
        e.preventDefault();
        updateDropEffect(e);
        this.fire('over', {x: xy[0], y: xy[1]});
        return false;
      }
    }).on('dragleave', () => {
      this.fire('leave');
    }).on('drop', () => {
      var e = <DragEvent>(<any>d3.event);
      e.preventDefault();
      var xy = d3.mouse($node.node());
      if (hasDnDType(e, 'application/phovea-data-item')) {
        var id = JSON.parse(e.dataTransfer.getData('application/phovea-data-item'));
        getData(id).then((d) => {
          this.fire('drop', d, e.dataTransfer.dropEffect, {x: xy[0], y: xy[1]});
          if (this.handler) {
            this.handler(d, e.dataTransfer.dropEffect, {x: xy[0], y: xy[1]});
          }
        });
        return false;
      }
    });
  }
}

export function makeDropable(elem:Element, onDrop?:(d:IDataType, op:string, pos:{ x: number, y : number}) => void, options = {}) {
  return new DropDataItemHandler(elem, onDrop, options);
}

export function makeDraggable<T>(sel:d3.Selection<T>, data_getter: (d:T) => IDataType = (d:any)=>d) {
  sel
    .attr('draggable', true)
    .on('dragstart', function (d) {
      const e = <DragEvent>(<any>d3.event);
      const data = data_getter(d);
      if (data) {
        e.dataTransfer.effectAllowed = 'copy'; //none, copy, copyLink, copyMove, link, linkMove, move, all
        e.dataTransfer.setData('text/plain', data.desc.name);
        e.dataTransfer.setData('application/json', JSON.stringify(data.desc));
        var p = JSON.stringify(data.persist());
        //generic variant
        e.dataTransfer.setData('application/phovea-data-item', p);
        //variant with the type encoded
        e.dataTransfer.setData('application/phovea-data-'+data.desc.type,p);
        //encode the id in the mime type
        e.dataTransfer.setData('application/phovea-data-item-' + p, p);
      }
    });
}


export function create(parent, options = {}) {
  return new DataBrowser(parent, options);
}
