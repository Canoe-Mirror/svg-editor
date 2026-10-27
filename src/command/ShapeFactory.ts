import { Circle } from '../model/Circle';
import type { Document } from '../model/Document';
import { Ellipse } from '../model/Ellipse';
import { Group } from '../model/Group';
import { Line } from '../model/Line';
import { Rect } from '../model/Rect';
import { TextShape } from '../model/TextShape';
import type { Shape } from '../model/Shape';

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
        return new TextShape(
          id,
          ShapeFactory.num(params[0]),
          ShapeFactory.num(params[1]),
          params[2],
        );
      }
      case 'g': {
        ShapeFactory.expect(params, 0, 0, type);
        return new Group(id);
      }
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
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
