/**
 * Created by Samuel Gratzl on 05.08.2014.
 * @deprecated old use links module
 */
import * as d3 from 'd3';
import { Range } from 'tdp_core';
import { IDType } from 'tdp_core';
class LinksRendererId {
    constructor() {
        this._id = 0;
    }
    nextID() {
        return this._id++;
    }
    static getInstance() {
        if (!LinksRendererId.instance) {
            LinksRendererId.instance = new LinksRendererId();
        }
        return LinksRendererId.instance;
    }
}
export class LinksRenderer {
    constructor(parent) {
        this.visses = [];
        this.observing = d3.map();
        this.$parent = d3.select(parent);
        this.$div = this.$parent.append('div').attr({
            'class': 'layer layer1 links'
        });
        this.$svg = this.$div.append('svg').attr({
            width: '100%',
            height: '100%'
        });
    }
    register(idtype) {
        const l = () => this.update(idtype);
        idtype.on(IDType.EVENT_SELECT, l);
        return {
            idtype,
            l,
            visses: [],
            push: (vis, dimension) => {
                this.visses.push({ vis, dim: dimension, id: LinksRendererId.getInstance().nextID() });
            },
            remove: (vis) => {
                const v = this.visses;
                for (let i = v.length - 1; i >= 0; --i) {
                    if (v[i].vis === vis) {
                        v.splice(i, 1);
                    }
                }
            }
        };
    }
    unregister(entry) {
        const idtype = entry.idtype;
        idtype.off(IDType.EVENT_SELECT, entry.l);
    }
    push(vis) {
        this.visses.push(vis);
        const observing = this.observing;
        //register to all idtypes
        vis.data.forEach((idtype, i) => {
            if (observing.has(idtype.id)) {
                observing.get(idtype.id).push(vis, i);
            }
            else {
                const r = this.register(idtype);
                r.push(vis, i);
                observing.set(idtype.id, r);
                this.updateIDTypes();
            }
        });
        this.update();
    }
    remove(vis) {
        const i = this.visses.indexOf(vis);
        if (i >= 0) {
            this.visses.splice(i, 1);
        }
        const observing = this.observing;
        vis.data.forEach((idtype) => {
            const r = observing.get(idtype.id);
            r.remove(vis);
            if (r.visses.length === 0) { //no more reference, we can unregister it
                this.unregister(r);
                observing.remove(idtype.id);
                this.updateIDTypes();
            }
        });
        this.update();
    }
    update(idtype) {
        function prepareCombinations(entry, $group) {
            const combinations = [];
            const l = entry.visses.length;
            for (let i = 0; i < l; ++i) {
                const a = entry.visses[i].id;
                for (let j = 0; j < i; ++j) {
                    const b = entry.visses[j].id;
                    combinations.push(Math.min(a, b) + '-' + Math.max(a, b));
                }
            }
            const $combi = $group.selectAll('g').data(combinations);
            $combi.enter().append('g');
            $combi.exit().remove();
            $combi.attr('data-id', String);
        }
        function createLinks(existing, id, locs, $group) {
            if (existing.length === 0) {
                return;
            }
            existing.forEach((ex) => {
                const swap = id > ex.id;
                const group = Math.min(id, ex.id) + '-' + Math.max(id, ex.id);
                const $g = $group.select('g[data-id="' + group + '"]');
                const links = [];
                locs.forEach((loc, i) => {
                    if (loc && ex.locs[i]) {
                        const cs = this.selectCorners(loc, ex.locs[i]);
                        const r = [loc.corner(cs[0]), ex.locs[i].corner(cs[1])];
                        links.push(swap ? r.reverse() : r);
                    }
                });
                const $links = $g.selectAll('path').data(links);
                $links.enter().append('path').attr('class', 'phovea-select-selected');
                $links.exit().remove();
                $links.attr('d', this.line);
            });
        }
        const addLinks = (entry) => {
            const $group = this.$svg.select(`g[data-idtype="${entry.idtype.id}"]`);
            if (entry.visses.length <= 1) { //no links between single item
                $group.selectAll('*').remove();
                return;
            }
            //collect all links
            const selected = entry.idtype.selections();
            if (selected.isNone) {
                $group.selectAll('*').remove();
                return;
            }
            console.log(entry.idtype.id, selected.toString());
            //prepare groups for all combinations
            prepareCombinations(entry, $group);
            //load and find the matching locations
            const loaded = [];
            entry.visses.forEach((entry) => {
                const id = entry.id;
                entry.vis.data.ids().then((ids) => {
                    const dim = ids.dim(entry.dim);
                    const locations = [], tolocate = [];
                    selected.dim(0).iter().forEach((id) => {
                        const mapped = dim.indexOf(id);
                        if (mapped < 0) {
                            locations.push(-1);
                        }
                        else {
                            locations.push(tolocate.length);
                            tolocate.push(Range.list(mapped));
                        }
                    });
                    if (tolocate.length === 0) {
                        //no locations at all
                        return;
                    }
                    //at least one mapped location
                    entry.vis.locate.apply(entry.vis, tolocate).then((located) => {
                        let fulllocations;
                        if (tolocate.length === 1) {
                            fulllocations = locations.map((index) => index < 0 ? undefined : located);
                        }
                        else {
                            fulllocations = locations.map((index) => located[index]);
                        }
                        createLinks(loaded, id, fulllocations, $group);
                        loaded.push({ id, locs: fulllocations });
                    });
                });
            });
        };
        if (idtype) {
            addLinks(this.observing.get(idtype.id));
        }
        else {
            this.observing.values().forEach(addLinks);
        }
    }
    updateIDTypes() {
        const $g = this.$svg.selectAll('g').data(this.observing.values());
        $g.enter().append('g');
        $g.exit().remove();
        $g.attr('data-idtype', (d) => d.idtype.id);
    }
    static createLinksRenderer(parent) {
        return new LinksRenderer(parent);
    }
}
LinksRenderer.line = d3.svg.line();
//# sourceMappingURL=LinksRenderer.js.map