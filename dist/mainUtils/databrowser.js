/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
import '../scss/main.scss';
import { select, event as d3event, mouse } from 'd3';
import { DnDUtils, BaseUtils } from 'phovea_core';
import { DataCache } from 'phovea_core';
import { EventHandler } from 'phovea_core';
export class DropDataItemHandler extends EventHandler {
    constructor(elem, handler, options = {}) {
        super();
        this.handler = handler;
        this.options = {
            types: []
        };
        BaseUtils.mixin(this.options, options);
        this.register(select(elem));
    }
    checkType(e) {
        if (this.options.types.length === 0) {
            return DnDUtils.getInstance().hasDnDType(e, 'application/phovea-data-item');
        }
        return this.options.types.some((t) => DnDUtils.getInstance().hasDnDType(e, 'application/phovea-data-' + t));
    }
    register($node) {
        $node.on('dragenter', () => {
            const e = d3event;
            const xy = mouse($node.node());
            if (this.checkType(e)) {
                e.preventDefault();
                this.fire('enter', { x: xy[0], y: xy[1] });
                return false;
            }
            return undefined;
        }).on('dragover', () => {
            const e = d3event;
            const xy = mouse($node.node());
            if (this.checkType(e)) {
                e.preventDefault();
                DnDUtils.getInstance().updateDropEffect(e);
                this.fire('over', { x: xy[0], y: xy[1] });
                return false;
            }
            return undefined;
        }).on('dragleave', () => {
            this.fire('leave');
        }).on('drop', () => {
            const e = d3event;
            e.preventDefault();
            const xy = mouse($node.node());
            if (DnDUtils.getInstance().hasDnDType(e, 'application/phovea-data-item')) {
                const id = JSON.parse(e.dataTransfer.getData('application/phovea-data-item'));
                DataCache.getInstance().get(id).then((d) => {
                    this.fire('drop', d, e.dataTransfer.dropEffect, { x: xy[0], y: xy[1] });
                    if (this.handler) {
                        this.handler(d, e.dataTransfer.dropEffect, { x: xy[0], y: xy[1] });
                    }
                });
                return false;
            }
            return undefined;
        });
    }
    static makeDropable(elem, onDrop, options = {}) {
        return new DropDataItemHandler(elem, onDrop, options);
    }
    static makeDraggable(sel, dataGetter = (d) => d) {
        sel
            .attr('draggable', true)
            .on('dragstart', function (d) {
            const e = d3event;
            const data = dataGetter(d);
            if (data) {
                e.dataTransfer.effectAllowed = 'copy'; //none, copy, copyLink, copyMove, link, linkMove, move, all
                e.dataTransfer.setData('text/plain', data.desc.name);
                e.dataTransfer.setData('application/json', JSON.stringify(data.desc));
                const p = JSON.stringify(data.persist());
                //generic variant
                e.dataTransfer.setData('application/phovea-data-item', p);
                //variant with the type encoded
                e.dataTransfer.setData('application/phovea-data-' + data.desc.type, p);
                //encode the id in the mime type
                e.dataTransfer.setData('application/phovea-data-item-' + p, p);
            }
        });
    }
}
export class DataBrowser extends EventHandler {
    constructor(parent, options = {}) {
        super();
        this.options = options;
        this.options = BaseUtils.mixin({
            layout: 'tree',
            draggable: true,
            filter: () => true
        }, options);
        this.$node = this.build(parent);
    }
    build(parent) {
        if (this.options.layout === 'tree') {
            return this.buildTree(parent);
        }
        else if (this.options.layout === 'list') {
            return this.buildList(parent);
        }
        return select(parent);
    }
    buildTree(parent) {
        const $node = select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
        const that = this;
        function buildLevel($level) {
            const $childs = $level.selectAll('li').data((d) => d.children);
            const $childsEnter = $childs.enter().append('li').classed('collapsed', true);
            const $label = $childsEnter.append('span')
                .on('click', function (d) {
                if (d.children.length > 0) {
                    const $parent = select(this.parentNode);
                    const collapse = !$parent.classed('collapsed');
                    $parent.classed('collapsed', collapse);
                    that.fire('toggleCollapse', d, collapse);
                    $parent.select('i').classed('fa-chevron-down', !collapse).classed('fa-chevron-right', collapse);
                }
                else {
                    that.fire('select', d.data);
                }
            })
                .call(DropDataItemHandler.makeDraggable, (d) => d.data);
            $label.append('i').attr('class', 'fa-li fa');
            $label.append('span');
            $childsEnter.append('ul').classed('fa-ul', true);
            $childs.select('i')
                .classed('fa-chevron-right', (d) => d.children.length > 0)
                .classed('fa-file-o', (d) => d.children.length === 0);
            $childs.select('span').attr('draggable', (d) => d.data !== null && that.options.draggable);
            $childs.select('span span').text((d) => {
                let r = d.name;
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
                    buildLevel(select(this).select('ul'));
                }
            });
            $childs.exit().remove();
        }
        DataCache.getInstance().tree(this.options.filter).then((root) => {
            $node.datum(root);
            buildLevel($node);
        });
        return $node;
    }
    buildList(parent) {
        const $node = select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
        DataCache.getInstance().list(this.options.filter).then((list) => {
            const $li = $node.selectAll('li').data(list);
            const $liEnter = $li.enter().append('li').append('span')
                .call(DropDataItemHandler.makeDraggable);
            $liEnter.append('i').attr('class', 'fa-li fa fa-file-o');
            $liEnter.append('span');
            $li.select('span span')
                .text((d) => d.desc.name);
            $li.exit().remove();
        });
        return $node;
    }
    static createDataBrowser(parent, options = {}) {
        return new DataBrowser(parent, options);
    }
}
//# sourceMappingURL=databrowser.js.map