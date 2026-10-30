import type { Operation } from '../command/Command';
import type { AppContext } from './AppContext';
import { requireArgCount, toNumber } from './Args';
import { AddToCommand } from '../command/AddToCommand';
import { CreateCommand } from '../command/CreateCommand';
import { DeleteCommand } from '../command/DeleteCommand';
import { GroupCommand } from '../command/GroupCommand';
import { MoveCommand } from '../command/MoveCommand';
import { ReorderCommand } from '../command/ReorderCommand';
import { ScaleCommand } from '../command/ScaleCommand';
import { SetCommand } from '../command/SetCommand';
import { UngroupCommand } from '../command/UngroupCommand';
import { CanvasOperation } from './commands/CanvasOperation';
import { HelpOperation } from './commands/HelpOperation';
import { InitOperation } from './commands/InitOperation';
import { RedoOperation } from './commands/RedoOperation';
import { TreeOperation } from './commands/TreeOperation';
import { UndoOperation } from './commands/UndoOperation';

export interface CommandEntry {
  readonly usage: string;
  readonly build: (tokens: string[], app: AppContext) => Operation;
}

export class CommandRegistry {
  private readonly entries = new Map<string, CommandEntry>();

  register(name: string, entry: CommandEntry): void {
    this.entries.set(name, entry);
  }

  lookup(name: string): CommandEntry | undefined {
    return this.entries.get(name);
  }

  usageList(): readonly { name: string; usage: string }[] {
    return [...this.entries.entries()].map(([name, entry]) => ({ name, usage: entry.usage }));
  }
}

export function buildDefaultRegistry(): CommandRegistry {
  const registry = new CommandRegistry();

  registry.register('init', {
    usage: 'init [w] [h]',
    build: (tokens, app) => {
      if (tokens.length > 3) {
        throw new Error('invalid arguments: init');
      }
      const width = tokens[1] === undefined ? 800 : toNumber(tokens[1]);
      const height = tokens[2] === undefined ? 600 : toNumber(tokens[2]);
      return new InitOperation(app, width, height);
    },
  });

  registry.register('create', {
    usage: 'create <type> <id> [params…] [in <containerId>]',
    build: (tokens, app) => {
      const type = tokens[1];
      const id = tokens[2];
      if (type === undefined || id === undefined) {
        throw new Error('invalid arguments: create');
      }
      const params = tokens.slice(3);
      const containerId = extractContainerId(params);
      return new CreateCommand(app.requireDocument(), type, id, params, containerId);
    },
  });

  registry.register('move', {
    usage: 'move <id> <dx> <dy>',
    build: (tokens, app) => {
      requireArgCount(tokens, 4, 'move');
      return new MoveCommand(app.requireDocument(), tokens[1] as string, toNumber(tokens[2]), toNumber(tokens[3]));
    },
  });

  registry.register('delete', {
    usage: 'delete <id>',
    build: (tokens, app) => {
      requireArgCount(tokens, 2, 'delete');
      return new DeleteCommand(app.requireDocument(), tokens[1] as string);
    },
  });

  registry.register('set', {
    usage: 'set <id> <attr> <value>',
    build: (tokens, app) => {
      requireArgCount(tokens, 4, 'set');
      return new SetCommand(app.requireDocument(), tokens[1] as string, tokens[2] as string, tokens[3] as string);
    },
  });

  registry.register('scale', {
    usage: 'scale <id> <factor>',
    build: (tokens, app) => {
      requireArgCount(tokens, 3, 'scale');
      return new ScaleCommand(app.requireDocument(), tokens[1] as string, toNumber(tokens[2]));
    },
  });

  registry.register('group', {
    usage: 'group <newGid> <id1> <id2>…',
    build: (tokens, app) => {
      if (tokens.length < 3) {
        throw new Error('invalid arguments: group');
      }
      return new GroupCommand(app.requireDocument(), tokens[1] as string, tokens.slice(2));
    },
  });

  registry.register('ungroup', {
    usage: 'ungroup <gid>',
    build: (tokens, app) => {
      requireArgCount(tokens, 2, 'ungroup');
      return new UngroupCommand(app.requireDocument(), tokens[1] as string);
    },
  });

  registry.register('addto', {
    usage: 'addto <gid> <id>',
    build: (tokens, app) => {
      requireArgCount(tokens, 3, 'addto');
      return new AddToCommand(app.requireDocument(), tokens[1] as string, tokens[2] as string);
    },
  });

  registry.register('front', {
    usage: 'front <id>',
    build: (tokens, app) => {
      requireArgCount(tokens, 2, 'front');
      return new ReorderCommand(app.requireDocument(), tokens[1] as string, 'front');
    },
  });

  registry.register('back', {
    usage: 'back <id>',
    build: (tokens, app) => {
      requireArgCount(tokens, 2, 'back');
      return new ReorderCommand(app.requireDocument(), tokens[1] as string, 'back');
    },
  });

  registry.register('canvas', {
    usage: 'canvas [w] [h]',
    build: (tokens, app) => {
      if (tokens.length > 3) {
        throw new Error('invalid arguments: canvas');
      }
      const width = tokens[1] === undefined ? undefined : toNumber(tokens[1]);
      const height = tokens[2] === undefined ? undefined : toNumber(tokens[2]);
      return new CanvasOperation(app, width, height);
    },
  });

  registry.register('tree', {
    usage: 'tree [id]',
    build: (tokens, app) => {
      if (tokens.length > 2) {
        throw new Error('invalid arguments: tree');
      }
      return new TreeOperation(app, tokens[1]);
    },
  });

  registry.register('undo', {
    usage: 'undo',
    build: (tokens, app) => {
      requireArgCount(tokens, 1, 'undo');
      return new UndoOperation(app);
    },
  });

  registry.register('redo', {
    usage: 'redo',
    build: (tokens, app) => {
      requireArgCount(tokens, 1, 'redo');
      return new RedoOperation(app);
    },
  });

  registry.register('help', {
    usage: 'help',
    build: () => new HelpOperation(registry.usageList()),
  });

  return registry;
}

function extractContainerId(params: string[]): string | undefined {
  if (params.length >= 2 && params[params.length - 2] === 'in') {
    const containerId = params[params.length - 1];
    params.splice(params.length - 2, 2);
    return containerId;
  }
  return undefined;
}
