import { EVENT_ID, getScalarValue, parseEvents } from "js-yaml";

/** Where a path such as `roles[3].end` starts in the YAML text, as a 1-based line number. */
export type LineOf = (path: string) => number | undefined;

type Frame =
  | { kind: "sequence"; path: string; next: number }
  | { kind: "mapping"; path: string; key: string | undefined };

function lineStarts(source: string): number[] {
  const starts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function lineAt(starts: readonly number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((starts[middle] as number) <= offset) low = middle;
    else high = middle - 1;
  }
  return low + 1;
}

/**
 * Walks the parser's events and records the line of every mapping entry and list item.
 * A mapping entry is placed at its key, so an error about a value points at the line you edit.
 * The source must already be known to parse, which the caller checks first.
 */
export function buildLineIndex(source: string): LineOf {
  const starts = lineStarts(source);
  const lines = new Map<string, number>();
  const stack: Frame[] = [];

  interface Started {
    readonly isKey: boolean;
    readonly path: string;
  }

  /** Records the node that starts at `offset`, and says whether it is a mapping key. */
  const startNode = (offset: number, keyText: () => string): Started => {
    const parent = stack[stack.length - 1];
    if (parent === undefined) return { isKey: false, path: "" };
    if (parent.kind === "sequence") {
      const path = `${parent.path}[${parent.next}]`;
      parent.next += 1;
      lines.set(path, lineAt(starts, offset));
      return { isKey: false, path };
    }
    if (parent.key === undefined) {
      parent.key = keyText();
      lines.set(childPath(parent.path, parent.key), lineAt(starts, offset));
      return { isKey: true, path: "" };
    }
    return { isKey: false, path: childPath(parent.path, parent.key) };
  };

  /** After a value is complete, the next node of a mapping is a key again. */
  const finishValue = () => {
    const parent = stack[stack.length - 1];
    if (parent?.kind === "mapping") parent.key = undefined;
  };

  for (const event of parseEvents(source, {})) {
    if (event.type === EVENT_ID.SCALAR) {
      const node = startNode(event.valueStart, () => getScalarValue(source, event));
      if (!node.isKey) finishValue();
    } else if (event.type === EVENT_ID.SEQUENCE || event.type === EVENT_ID.MAPPING) {
      const node = startNode(event.start, () => "");
      stack.push(
        event.type === EVENT_ID.SEQUENCE
          ? { kind: "sequence", path: node.path, next: 0 }
          : { kind: "mapping", path: node.path, key: undefined },
      );
    } else if (event.type === EVENT_ID.POP) {
      stack.pop();
      finishValue();
    }
  }

  return (path) => lines.get(path);
}

function childPath(parent: string, key: string): string {
  return parent === "" ? key : `${parent}.${key}`;
}
