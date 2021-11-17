/**
 * Created by sam on 16.02.2015.
 */
import { ShapeUtils } from 'tdp_core';
import { Range, CompositeRange1D, Range1DGroup } from 'tdp_core';
export class LinkRepresentation {
    static createBlockRep(context, a, aa, b, bb) {
        const adim = a.dimOf(context.idtype), bdim = b.dimOf(context.idtype);
        return Promise.all([a.ids(), b.ids()]).then((ids) => {
            const ida = ids[0].dim(adim);
            const idb = ids[1].dim(bdim);
            return context.createBand(aa, bb, ida, idb, ida.intersect(idb), 'block', 'rel-block');
        });
    }
    static toArray(a) {
        if (!Array.isArray(a)) {
            return [a];
        }
        return a;
    }
    static createGroupRep(context, a, aa, b, bb) {
        const adim = a.dimOf(context.idtype), bdim = b.dimOf(context.idtype);
        function toGroups(ids) {
            if (ids instanceof CompositeRange1D) {
                return ids.groups;
            }
            else {
                return [Range1DGroup.asUngrouped(ids)];
            }
        }
        return Promise.all([a.ids(), b.ids()]).then((ids) => {
            const groupa = toGroups(ids[0].dim(adim));
            const groupb = toGroups(ids[1].dim(bdim));
            const ars = groupa.map((group) => {
                const r = Range.all();
                r.dims[adim] = group;
                return r;
            });
            const brs = groupb.map((group) => {
                const r = Range.all();
                r.dims[bdim] = group;
                return r;
            });
            return Promise.all([Promise.resolve({
                    groupa,
                    groupb
                }), a.locateById.apply(a, ars), b.locateById.apply(b, brs)]);
        }).then((data) => {
            function more(locs) {
                return (g, i) => {
                    return {
                        g,
                        len: g.length,
                        loc: locs[i] ? locs[i].aabb() : null
                    };
                };
            }
            const groupa = data[0].groupa.map(more(this.toArray(data[1])));
            const groupb = data[0].groupb.map(more(this.toArray(data[2])));
            const r = [];
            groupa.forEach((ga) => {
                groupb.forEach((gb) => {
                    const int = ga.g.intersect(gb.g);
                    const l = int.length;
                    if (l === 0) {
                        return;
                    }
                    const id = ga.g.name + '-' + gb.g.name;
                    if (ga.loc && gb.loc) {
                        r.push.apply(r, context.createBand(ga.loc, gb.loc, ga.g, gb.g, int, id, 'rel-group'));
                        //shift the location for attaching
                        ga.loc.y += ga.loc.h * (l / ga.len);
                        gb.loc.y += gb.loc.h * (l / gb.len);
                    }
                });
            });
            return r;
        });
    }
    static selectCorners(a, b) {
        const ac = a.aabb(), bc = b.aabb();
        if (ac.cx > bc.cx) {
            return ['w', 'e'];
        }
        else {
            return ['e', 'w'];
        }
        // TODO better
    }
    static createItemRep(context, a, aa, b, bb) {
        const adim = a.dimOf(context.idtype), bdim = b.dimOf(context.idtype), amulti = a.data.dim.length > 1, bmulti = b.data.dim.length > 1;
        function toPoint(loc, other, multi) {
            if (!multi) {
                return loc.center;
            }
            const c = this.selectCorners(loc, other);
            return loc.corner(c[0]);
        }
        return Promise.all([a.ids(), b.ids()]).then((ids) => {
            const ida = ids[0].dim(adim);
            const idb = ids[1].dim(bdim);
            const union = ida.intersect(idb);
            const ars = [], brs = [];
            union.forEach((index) => {
                const r = Range.all();
                r.dim(adim).setList([index]);
                ars.push(r);
                const r2 = Range.all();
                r2.dim(bdim).setList([index]);
                brs.push(r2);
            });
            return Promise.all([Promise.resolve(union), a.locateById.apply(a, ars), b.locateById.apply(b, brs)]);
        }).then((locations) => {
            const union = locations[0], loca = this.toArray(locations[1]), locb = this.toArray(locations[2]);
            const r = [];
            context.line.interpolate('linear');
            const selections = context.idtype.selections().dim(0);
            union.forEach((id, i) => {
                const la = ShapeUtils.wrapToShape(loca[i]);
                const lb = ShapeUtils.wrapToShape(locb[i]);
                if (la && lb) {
                    r.push({
                        clazz: 'rel-item' + (selections.contains(id) ? ' phovea-select-selected' : ''),
                        id: String(id),
                        d: context.line([toPoint(la, lb, amulti), toPoint(lb, la, bmulti)]),
                        range: Range.list([id])
                    });
                } //TODO optimize use the native select to just update the classes and not recreate them
            });
            return r;
        });
    }
}
//# sourceMappingURL=LinkRepresentation.js.map