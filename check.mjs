/**
 * Smoke check for the client bundle: it must register one factory under the
 * package id, return a plugin the harness can use, and wire both seats when
 * applied. Run: node check.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const loads = [];

globalThis.window = { __ModuleLoader__: { load: (spec) => loads.push(spec) } };
globalThis.document = {
  createElement: () => ({ dataset: {}, remove() {}, textContent: '' }),
  head: { append() {} },
};

new Function(source)();

assert.equal(loads.length, 1, 'exactly one module registration');
assert.equal(loads[0].id, 'dsh-model-effort-picker', 'factory id is the package name');

const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: Symbol('Fragment'),
  useEffect: () => {},
  useId: () => 'id',
  useMemo: (compute) => compute(),
  useRef: () => ({ current: null }),
  useState: () => [undefined, () => {}],
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
};

const plugin = loads[0].factory((name) => {
  if (name !== 'react') throw new Error(`unexpected runtime import: ${name}`);
  return React;
});

assert.equal(typeof plugin.apply, 'function', 'client half returns an apply');
assert.deepEqual(plugin.inject, [
  'slots',
  'locale',
  'modelDirectories',
  'sessions',
  'remote',
  'remote.settings',
]);

const registered = [];
const services = {
  modelDirectories: {
    directoryFor: () => ({
      store: {},
      load: () => Promise.resolve(),
      select: () => Promise.resolve({ ok: true }),
    }),
  },
  sessions: { subagentAddress: () => undefined },
  remote: {
    settings: {
      describe: () => Promise.resolve({ ok: true, value: { writable: true, namespaces: [] } }),
      update: () => Promise.resolve({ ok: true }),
    },
    $on: () => () => {},
  },
};

plugin.apply({
  effect: (callback) => {
    const off = callback();
    return typeof off === 'function' ? off : () => {};
  },
  get: (name) => services[name],
  locale: { register: () => () => {} },
  slots: {
    inject: (_key, create) => create(),
    register: (options, component) => {
      registered.push({ options, component });
      return () => {};
    },
  },
});

assert.deepEqual(
  registered.map(({ options }) => ({
    name: options.name,
    id: options.id ?? null,
    order: options.order ?? null,
    priority: options.priority ?? null,
  })),
  [
    { name: 'conversation.input.model', id: null, order: null, priority: -20 },
    { name: 'conversation.input.activity', id: null, order: null, priority: null },
  ],
  'both seats are registered with the winning model priority',
);

// Render the slider from fabricated session snapshots and inspect its stops.
const slider = registered.find(
  ({ options }) => options.name === 'conversation.input.activity',
).component;

/**
 * Render the slider for one model's level list.
 * @param levels - level ids, lowest first.
 * @returns the tick nodes, in level order.
 */
function renderTicks(levels) {
  const snapshot = {
    current: { provider: 'p', model: 'm' },
    groups: [
      {
        id: 'p',
        name: 'P',
        models: [
          {
            id: 'm',
            name: 'M',
            // No defaultEffort, so the slider prepends a "provider default" stop.
            reasoning: { efforts: levels.map((id) => ({ id, name: id })) },
          },
        ],
      },
    ],
    status: 'ready',
    pending: null,
    retainedEffort: undefined,
  };
  const tree = slider({
    locked: false,
    available: true,
    directory: { subscribe: () => () => {}, getSnapshot: () => snapshot },
    load: () => {},
    select: () => Promise.resolve(true),
    t: (key) => key,
  });
  const ticks = [];
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node === null || typeof node !== 'object') return;
    if (node.props?.className === 'mfl-effortTick') ticks.push(node);
    walk(node.children);
  })(tree);
  return ticks;
}

// Four levels land on the scheme's tokens; more levels must still stay distinct,
// since adapters are free to advertise more than four.
for (const levels of [
  ['off', 'low', 'high', 'max'],
  ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'],
  ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
]) {
  const ticks = renderTicks(levels);
  assert.equal(
    ticks.length,
    levels.length + 1,
    `${levels.length} levels: one tick each, plus the provider default`,
  );
  const tints = ticks.map((tick) => tick.props.style.color);
  assert.equal(
    new Set(tints).size,
    tints.length,
    `${levels.length} levels: every stop gets its own tint`,
  );
  assert.ok(
    tints.every((tint) => typeof tint === 'string' && tint.includes('color-mix(')),
    `${levels.length} levels: tints are mixed from theme tokens`,
  );
}

console.log('client bundle loads, wires both seats, and tints one stop per level');
