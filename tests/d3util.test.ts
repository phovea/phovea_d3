/// <reference types="jest" />
import {transform} from '../src/d3util';

describe('transform', () => {
  it('empty', () => {
    expect(transform().toString()).toEqual('translate(0,0)rotate(0)skewX(0)scale(1,1)');
  });

  it('with parameters', () => {
    expect(transform(1, 2, 3, 4, 5).toString()).toEqual('translate(1,2)rotate(3)skewX(0)scale(4,5)');
  });
});
