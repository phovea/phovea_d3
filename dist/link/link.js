/**
 * Created by Samuel Gratzl on 16.12.2014.
 */
import { AppContext, BaseUtils } from 'tdp_core';
import { Polygon } from 'tdp_core';
import { Vector2D } from 'tdp_core';
import { IDType, SelectionUtils } from 'tdp_core';
import { Range } from 'tdp_core';
import { PluginRegistry } from 'tdp_core';
import * as d3 from 'd3';
class VisWrapper {
    /**
     * @param v the vis to wrap
     * @param dirtyEvents list of events when the vis is dirty
     */
    constructor(v, dirtyEvents) {
        this.v = v;
        this.dirtyEvents = dirtyEvents;
        this.callbacks = [];
        this.lookup = new Map();
        this.l = () => {
            this.callbacks.forEach((c) => c(this));
        };
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
    dimOf(idtype) {
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
    locate(...range) {
        return this.v.locate.apply(this.vis, range);
    }
    locateById(...range) {
        return this.v.locateById.apply(this.vis, range);
    }
    destroy() {
        this.dirtyEvents.forEach((event) => this.v.off(event, this.l));
    }
}
function toId(a, b) {
    a = typeof a === 'number' ? a : a.id;
    b = typeof b === 'number' ? b : b.id;
    return Math.min(a, b) + '-' + Math.max(a, b);
}
const lineGlobal = d3.svg.line().interpolate('linear-closed').x((d) => d.x).y((d) => d.y);
class Link {
    constructor(a, b, idtype, all, options = {}) {
        this.a = a;
        this.b = b;
        this.idtype = idtype;
        this.all = all;
        this.options = {
            reprs: PluginRegistry.getInstance().listPlugins('link-representation').sort((a, b) => b.granularity - a.granularity),
            animate: false,
            duration: 200,
            interactive: false,
            hover: false,
            mode: 1,
            canSelect: () => true,
            canHover: () => false
        };
        BaseUtils.mixin(this.options, options);
        this.id = toId(a, b);
    }
    async update($g) {
        let a = this.a, b = this.b, al = a.location.aabb(), bl = b.location.aabb(), tmp;
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
            return Promise.resolve();
        }
        const plugin = await this.options.reprs[Math.abs(this.mode($g)) - 1].load();
        const llinks = await plugin.factory(this, a, al, b, bl);
        if (this.options.interactive !== false) {
            llinks.unshift({
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
    }
    get line() {
        return lineGlobal;
    }
    createBand(aa, bb, ida, idb, union, id, clazz) {
        const ul = union.length;
        const l = [aa.corner('ne'), bb.corner('nw')];
        const r = [];
        function addBlock(ar, br, id, clazz, ashift, bshift) {
            const ll = l.slice();
            //compute the edge vector and scale it by the ratio
            const aDirection = Vector2D.fromPoints(l[0], aa.corner('se'));
            const bDirection = Vector2D.fromPoints(l[1], bb.corner('sw'));
            ll.push(l[1].add(bDirection.multiply(br)));
            ll.push(l[0].add(aDirection.multiply(ar)));
            if (ashift > 0) {
                ll[0].addEquals(aDirection.multiplyEquals(ashift));
            }
            if (bshift > 0) {
                ll[1].addEquals(bDirection.multiplyEquals(bshift));
            }
            r.push({
                clazz,
                d: lineGlobal.interpolate('linear-closed')(ll),
                id,
                range: Range.list(union)
            });
        }
        //create a selection overlay
        const s = this.idtype.selections().dim(0);
        const selected = !s.isNone ? union.intersect(s).length : 0;
        if (selected > 0) {
            addBlock(selected / ida.length, selected / idb.length, id + '-sel', clazz + ' phovea-select-' + SelectionUtils.defaultSelectionType, 0, 0);
        }
        addBlock(ul / ida.length, ul / idb.length, id, clazz, selected / ida.length, selected / idb.length);
        if (this.options.hover) {
            const hs = this.idtype.selections(SelectionUtils.hoverSelectionType).dim(0);
            const hovered = !hs.isNone ? union.intersect(hs).length : 0;
            if (hovered > 0) {
                addBlock(hovered / ida.length, hovered / idb.length, id + '-sel', clazz + ' phovea-select-' + SelectionUtils.hoverSelectionType, 0, 0);
            }
        }
        //console.error('created band');
        return r;
    }
    shouldRender(a, aa, b, bb) {
        if (aa.x2 < (bb.x - 10)) {
            //nothing to do
        }
        else {
            return false;
        }
        const shape = Polygon.polygon(aa.corner('ne'), bb.corner('nw'), bb.corner('sw'), aa.corner('se'));
        //check if we have an intersection
        return this.all.every((other) => {
            if (other === this.a || other === this.b) { //don't check me
                return true;
            }
            const o = other.location;
            const int = shape.intersects(o);
            return !int.intersects;
        });
    }
    mode($g) {
        let m = parseInt($g.attr('data-mode'), 10);
        if (m) {
            return m;
        }
        m = this.options.mode;
        if (typeof m === 'string') {
            return 1 + this.options.reprs.findIndex((c) => c.id === m);
        }
        return m;
    }
    setMode($g, value) {
        $g.attr('data-mode', value);
        this.update($g);
    }
    nextMode($g) {
        const l = this.options.reprs.length;
        let mode = this.mode($g);
        if (l === 1) {
            return;
        }
        if (mode > 0) {
            mode = mode === l ? -mode + 1 : mode + 1;
        }
        else if (mode < 0) {
            mode = mode === -1 ? -mode + 1 : mode + 1;
        }
        this.setMode($g, mode);
    }
    render(links, $g) {
        const $links = $g.selectAll('path').data(links, (d) => d.id);
        const $linksEnter = $links.enter().append('path').on('click', (link) => {
            const e = d3.event;
            if (link.range && this.options.canSelect()) {
                this.idtype.select(link.range, SelectionUtils.toSelectOperation(d3.event));
            }
            e.preventDefault();
            e.stopPropagation();
        });
        if (this.options.hover) {
            $linksEnter.on('mouseenter', (link) => {
                const e = d3.event;
                if (link.range && this.options.canHover()) {
                    this.idtype.select(SelectionUtils.hoverSelectionType, link.range);
                }
                e.preventDefault();
                e.stopPropagation();
            }).on('mouseleave', (link) => {
                const e = d3.event;
                if (link.range && this.options.canHover()) {
                    this.idtype.clear(SelectionUtils.hoverSelectionType);
                }
                e.preventDefault();
                e.stopPropagation();
            });
        }
        $links.exit().remove();
        $links.attr({
            'class': (d) => d.clazz,
            d: (d) => d.d
        });
        if (this.options.interactive !== false) {
            $g.select('path.rel-back').on('contextmenu', () => {
                const e = d3.event;
                this.nextMode($g);
                e.preventDefault();
            });
        }
    }
}
class LinkIDTypeContainer {
    constructor(idtype, parent, options = {}) {
        this.idtype = idtype;
        this.listener = (event, type, selected, added, removed) => this.selectionUpdate(type, selected, added, removed);
        this.change = (elem) => this.changed(elem);
        this.arr = [];
        this.options = {
            duration: 0,
            filter: () => true
        };
        BaseUtils.mixin(this.options, options);
        idtype.on(IDType.EVENT_SELECT, this.listener);
        this.$node = d3.select(parent).append('svg');
        this.$node.style({
            left: '0px',
            top: '0px',
            opacity: 1
        });
        this.$node.append('g');
        AppContext.getInstance().onDOMNodeRemoved(this.$node.node(), this.destroy, this);
    }
    selectionUpdate(type, selected, added, removed) {
        //TODO
        this.renderAll();
    }
    hide() {
        this.$node.select('g').selectAll('g').transition().duration(this.options.duration).style('opacity', 0);
    }
    show() {
        this.$node.select('g').selectAll('g').transition().duration(this.options.duration).style('opacity', 1);
    }
    changed(elem) {
        if (this.arr.length > 1) {
            this.render(elem);
        }
    }
    moveSVG() {
        const l = this.arr[0].location.aabb();
        this.arr.forEach((a) => {
            const b = a.location.aabb();
            let d = 0;
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
            top: l.y + 'px'
        });
        this.$node.select('g').attr('transform', 'translate(' + (-l.x) + ',' + (-l.y) + ')');
    }
    prepareCombinations() {
        const $root = this.$node.select('g');
        const combinations = [];
        const l = this.arr.length;
        const filter = this.options.filter;
        for (let i = 0; i < l; ++i) {
            const a = this.arr[i];
            for (let j = 0; j < i; ++j) {
                const b = this.arr[j];
                if (filter(a.vis, b.vis)) {
                    combinations.push(new Link(a, b, this.idtype, this.arr, this.options));
                }
            }
        }
        const $combi = $root.selectAll('g').data(combinations, (l) => l.id);
        $combi.enter().append('g').attr('data-id', (l) => l.id);
        $combi.attr('data-id', (l) => l.id).style('opacity', this.options.animate ? 0 : 1);
        if (this.options.animate) {
            $combi.exit().transition().duration(this.options.duration).style('opacity', 0).remove();
        }
        else {
            $combi.exit().remove();
        }
    }
    update() {
        //move the svg to just the bounding box
        this.moveSVG();
        this.prepareCombinations();
        return this.renderAll();
    }
    renderAll() {
        const $root = this.$node.select('g');
        const l = this.arr.length;
        const promises = [];
        for (let i = 0; i < l; ++i) {
            const ai = this.arr[i];
            for (let j = 1; j < l; ++j) {
                const aj = this.arr[j];
                const id = toId(ai, aj);
                const $g = $root.select('g[data-id="' + id + '"]');
                $g.each(function (link) {
                    promises.push(link.update(d3.select(this)));
                });
            }
        }
        return Promise.all(promises);
    }
    render(elem) {
        //move the svg to just the bounding box
        this.moveSVG();
        this.prepareCombinations();
        const $root = this.$node.select('g');
        const promises = [];
        this.arr.forEach((o) => {
            if (o !== elem) {
                const id = toId(o, elem);
                $root.select('g[data-id="' + id + '"]').each(function (link) {
                    promises.push(link.update(d3.select(this)));
                });
            }
        });
        return Promise.all(promises);
    }
    destroy() {
        this.idtype.off('select', this.listener);
    }
    push(elem, triggerUpdate = true) {
        const idtypes = elem.idtypes;
        if (idtypes.indexOf(this.idtype) >= 0) {
            this.arr.push(elem);
            elem.callbacks.push(this.change);
            if (this.arr.length > 1 && triggerUpdate) {
                this.render(elem);
            }
        }
    }
    remove(elem, triggerUpdate = true) {
        const index = this.arr.indexOf(elem);
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
    static constantTrue() {
        return true;
    }
}
export class LinkContainer {
    constructor(parent, dirtyEvents, options = {}) {
        this.dirtyEvents = dirtyEvents;
        this.arr = [];
        this.links = [];
        this.options = {
            idTypeFilter: LinkIDTypeContainer.constantTrue
        };
        this.node = parent.ownerDocument.createElement('div');
        parent.appendChild(this.node);
        this.node.classList.add('link-container');
        AppContext.getInstance().onDOMNodeRemoved(this.node, this.destroy, this);
        BaseUtils.mixin(this.options, options);
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
    push(arg, ...elems) {
        const triggerUpdate = arg !== false;
        if (typeof arg !== 'boolean') {
            elems.unshift(arg);
        }
        const idTypeFilter = this.options.idTypeFilter;
        elems.forEach((elem) => {
            const w = new VisWrapper(elem, this.dirtyEvents);
            this.arr.push(w);
            const idtypes = w.idtypes.filter((idtype, i) => idTypeFilter(idtype, i, elem));
            //update all links
            this.links.forEach((l) => {
                l.push(w, triggerUpdate);
                const index = idtypes.indexOf(l.idtype);
                if (index >= 0) {
                    idtypes.splice(index, 1);
                }
            });
            //add missing idtypes
            idtypes.forEach((idtype) => {
                const n = new LinkIDTypeContainer(idtype, this.node, this.options);
                n.push(w, triggerUpdate);
                this.links.push(n);
            });
        });
    }
    remove(arg, elem) {
        const triggerUpdate = arg !== false;
        if (typeof arg !== 'boolean') {
            elem = arg;
        }
        const index = this.arr.findIndex((w) => w.vis === elem);
        if (index < 0) {
            return false;
        }
        const w = this.arr[index];
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
    destroy() {
        this.node.parentElement.removeChild(this.node);
        this.clear();
    }
}
//# sourceMappingURL=link.js.map