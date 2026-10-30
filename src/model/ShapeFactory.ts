import { Circle } from './Circle';
import { Ellipse } from './Ellipse';
import { Group } from './Group';
import { Line } from './Line';
import { Rect } from './Rect';
import { TextShape } from './TextShape';
import type { Shape } from './Shape';

export class ShapeFactory {
  static create(type: string, id: string, params: string[]): Shape {
    switch (type) {
      case 'rect': {
        ShapeFactory.expect(params, 4, 5, type);
        const shape = new Rect(id, {
          x: ShapeFactory.num(params[0]),
          y: ShapeFactory.num(params[1]),
          width: ShapeFactory.num(params[2]),
          height: ShapeFactory.num(params[3]),
        });
        ShapeFactory.applyOptionalStyle(shape, params[4], 'fill');
        return shape;
      }
      case 'circle': {
        ShapeFactory.expect(params, 3, 4, type);
        const shape = new Circle(id, {
          cx: ShapeFactory.num(params[0]),
          cy: ShapeFactory.num(params[1]),
          r: ShapeFactory.num(params[2]),
        });
        ShapeFactory.applyOptionalStyle(shape, params[3], 'fill');
        return shape;
      }
      case 'ellipse': {
        ShapeFactory.expect(params, 4, 5, type);
        const shape = new Ellipse(id, {
          cx: ShapeFactory.num(params[0]),
          cy: ShapeFactory.num(params[1]),
          rx: ShapeFactory.num(params[2]),
          ry: ShapeFactory.num(params[3]),
        });
        ShapeFactory.applyOptionalStyle(shape, params[4], 'fill');
        return shape;
      }
      case 'line': {
        ShapeFactory.expect(params, 4, 5, type);
        const shape = new Line(id, {
          x1: ShapeFactory.num(params[0]),
          y1: ShapeFactory.num(params[1]),
          x2: ShapeFactory.num(params[2]),
          y2: ShapeFactory.num(params[3]),
        });
        ShapeFactory.applyOptionalStyle(shape, params[4], 'stroke');
        return shape;
      }
      case 'text': {
        ShapeFactory.expect(params, 3, 3, type);
        return new TextShape(id, ShapeFactory.num(params[0]), ShapeFactory.num(params[1]), params[2]);
      }
      case 'g': {
        ShapeFactory.expect(params, 0, 0, type);
        return new Group(id);
      }
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  static supports(tag: string): boolean {
    return ShapeFactory.blank(tag, '_') !== null;
  }

  static restore(tag: string, id: string, attrs: ReadonlyMap<string, string>): Shape | null {
    const shape = ShapeFactory.blank(tag, id);
    if (shape === null) {
      return null;
    }
    shape.loadAttributes(attrs);
    return shape;
  }

  private static blank(tag: string, id: string): Shape | null {
    switch (tag) {
      case 'rect':
        return new Rect(id);
      case 'circle':
        return new Circle(id);
      case 'ellipse':
        return new Ellipse(id);
      case 'line':
        return new Line(id);
      case 'text':
        return new TextShape(id, 0, 0, '');
      case 'g':
        return new Group(id);
      default:
        return null;
    }
  }

  private static expect(params: string[], min: number, max: number, type: string): void {
    if (params.length < min || params.length > max) {
      throw new Error(`invalid arguments: create ${type}`);
    }
  }

  private static num(raw: string | undefined): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`invalid number: ${raw ?? ''}`);
    }
    return value;
  }

  private static applyOptionalStyle(shape: Shape, value: string | undefined, key: string): void {
    if (value !== undefined) {
      shape.setAttribute(key, value);
    }
  }
}
