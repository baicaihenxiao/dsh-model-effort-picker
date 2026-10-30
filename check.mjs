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
const injectedStyles = [];
globalThis.document = {
  createElement: () => ({ dataset: {}, remove() {}, textContent: '' }),
  head: { append: (tag) => injectedStyles.push(tag) },
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
  'connection', // the provider's speed-tier lists ride its own RPC channel
  'remote',
  'remote.session', // read by modelDirectories.directoryFor under our inject on DSH 0.2.1+
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
  connection: {
    rpc: {
      call: (channel, endpoint) =>
        Promise.resolve(
          channel === '/api' && endpoint === 'codex-subscription/preferences/status'
            ? { ok: true, value: { fastModels: ['gpt-6.1-sol'], ultrafastModels: ['gpt-6.1-sol'] } }
            : { ok: false },
        ),
    },
  },
  remote: {
    settings: {
      describe: () =>
        Promise.resolve({
          ok: true,
          value: {
            writable: true,
            namespaces: [{ ns: 'codex-subscription', value: { speedMode: 'fast' } }],
          },
        }),
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

// The painted geometry comes from the injected style sheet, so the offsets and
// fill asserted below are checked against it instead of restating the numbers.
const css = injectedStyles.map((tag) => tag.textContent).join('');
assert.ok(css.includes('.mfl-effortRange'), 'the slider style sheet is injected');
const THUMB = Number(/::-webkit-slider-thumb\{[^}]*width:([\d.]+)px/.exec(css)[1]);
const TRACK = Number(/::-webkit-slider-runnable-track\{height:([\d.]+)px/.exec(css)[1]);
const THUMB_MARGIN = Number(/::-webkit-slider-thumb\{[^}]*margin-top:-([\d.]+)px/.exec(css)[1]);
assert.equal(THUMB_MARGIN, (THUMB - TRACK) / 2, 'the thumb sits centred on the track');
assert.ok(
  css.includes(
    'linear-gradient(to right,var(--dsw-alias-brand-primary) var(--mfl-fill,0%),var(--dsw-alias-label-caption) 0)',
  ),
  'the track past the selected level uses the quieter color',
);

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
 * @param options - stored selection and adapter default effort.
 * @returns the tick nodes in level order, the range input's painted fill, the block width, and the label cap.
 */
function renderSlider(levels, options = {}) {
  const { reasoningEffort, defaultEffort, reasoning } = options;
  const snapshot = {
    current: {
      provider: 'p',
      model: 'm',
      ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    },
    groups: [
      {
        id: 'p',
        name: 'P',
        models: [
          {
            id: 'm',
            name: 'M',
            // Without a defaultEffort the slider prepends a "provider default" stop.
            reasoning: reasoning ?? {
              ...(defaultEffort === undefined ? {} : { defaultEffort }),
              efforts: levels.map((id) => ({ id, name: id })),
            },
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
  let fill;
  let width;
  let gap;
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node === null || typeof node !== 'object') return;
    if (node.props?.className === 'mfl-effortTick') ticks.push(node);
    if (node.props?.className === 'mfl-effortSlider') {
      width = node.props.style.width;
      gap = node.props.style['--mfl-gap'];
    }
    if (node.props?.type === 'range') fill = node.props.style['--mfl-fill'];
    walk(node.children);
  })(tree);
  return { ticks, fill, width, gap };
}

// Four levels land on the scheme's tokens; more levels must still stay distinct,
// since adapters are free to advertise more than four.
const CASES = [
  ['off', 'low', 'high', 'max'],
  ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'],
  ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
];
for (const levels of CASES) {
  const { ticks } = renderSlider(levels);
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

  // Every stop is centred on its own offset, ends included: anchoring the end
  // labels to the box edges is what made the gaps uneven at six levels. The
  // offsets are checked against the painted geometry below.
  const ratios = ticks.map((tick) => {
    const { left, right, transform } = tick.props.style;
    assert.equal(right, undefined, `${levels.length} levels: no edge-anchored label`);
    assert.equal(transform, 'translateX(-50%)', `${levels.length} levels: every label centred`);
    const match = /^calc\(([\d.]+)px \+ \(100% - ([\d.]+)px\) \* ([\d.]+)\)$/.exec(left);
    assert.ok(match, `${levels.length} levels: unexpected stop offset ${left}`);
    assert.equal(Number(match[1]), THUMB / 2, 'a stop starts at the thumb radius');
    assert.equal(Number(match[2]), THUMB, 'a stop ends at the thumb radius');
    return Number(match[3]);
  });
  assert.deepEqual(
    ratios,
    ratios.map((_ratio, index) => Number((index / (ratios.length - 1)).toFixed(4))),
    `${levels.length} levels: stops are evenly spaced`,
  );
}

// A crowded track can only be fixed by giving it room: the base length covers
// four stops and each extra stop widens it, up to a cap. Asserted as behaviour
// rather than as the formula, so retuning the numbers does not fail the check.
const widths = CASES.map((levels) => renderSlider(levels).width);
const lengths = widths.map((width) => {
  const match = /^calc\((\d+)px \+ 2 \* var\(--mfl-pad\)\)$/.exec(width);
  assert.ok(match, `unexpected track width ${width}`);
  return Number(match[1]);
});
assert.ok(lengths[0] >= 150, `four stops keep at least the base length: ${lengths[0]}px`);
assert.ok(
  lengths[0] < lengths[1] && lengths[1] <= lengths[2],
  `a longer level list widens the track: ${lengths.join('px, ')}px`,
);

// However long a provider names a level, a label is cut to the gap between two
// stops so neighbours cannot overlap, and the tick's title keeps the full name.
assert.match(
  css,
  /\.mfl-effortTickText\{[^}]*max-width:var\(--mfl-gap\);overflow:hidden;text-overflow:ellipsis\}/,
  'a tick label is capped at the stop gap with an ellipsis',
);
CASES.forEach((levels, index) => {
  const { ticks, gap } = renderSlider(levels);
  const match = /^([\d.]+)px$/.exec(gap);
  assert.ok(match, `unexpected label cap ${gap}`);
  assert.ok(
    Math.abs(Number(match[1]) * (ticks.length - 1) + THUMB - lengths[index]) < 1e-6,
    `${levels.length} levels: the label cap ${gap} is the distance between two stops`,
  );
});
const LONG = 'Ultra (DSH parallel · xhigh)';
const longTick = renderSlider([], {
  reasoning: { defaultEffort: 'low', efforts: [{ id: 'low', name: 'Low' }, { id: 'ultra', name: LONG }] },
}).ticks[1];
assert.equal(longTick.props.title, LONG, 'the tick title keeps the full level name');
assert.deepEqual(
  longTick.children.map((child) => [child.props.className, child.children[0]]),
  [['mfl-effortTickText', LONG]],
  'the label sits in its own capped box',
);

// The painted fill has to trail the thumb, so it runs from the first stop to the
// last: both ends are asserted, since a stuck or off-by-one fill is invisible in
// a static read of the CSS.
const LEVELS = ['off', 'low', 'high', 'max'];
const lowEnd = renderSlider(LEVELS).fill;
const highEnd = renderSlider(LEVELS, { reasoningEffort: 'max' }).fill;
assert.match(lowEnd, /\* 0\.0000\)$/, `fill starts at the lowest stop: ${lowEnd}`);
assert.match(highEnd, /\* 1\.0000\)$/, `fill reaches the highest stop: ${highEnd}`);
assert.ok(
  lowEnd.startsWith(`calc(${THUMB / 2}px + (100% - ${THUMB}px) *`),
  `the fill is inset by the thumb, so its edge meets the thumb centre: ${lowEnd}`,
);

// The ramp is the whole point of the tint, so pin it: a model with exactly as
// many levels as the ramp has stops must land one label on each color, in order.
const RAMP = ['#475569', '#2563EB', '#4F46E5', '#6D28D9', '#7E22CE', '#86198F'];
const rampTicks = renderSlider(
  ['off', 'low', 'medium', 'high', 'xhigh', 'max'],
  { defaultEffort: 'low' },
).ticks;
assert.equal(rampTicks.length, RAMP.length, 'six levels with a default: no extra stop');

/** The color a `color-mix(A t%, B)` actually resolves to at a ramp stop. */
function rampStopOf(tint) {
  const match = /color-mix\(in oklab, (#[0-9A-F]{6}) (\d+)%, (#[0-9A-F]{6})\)/.exec(tint);
  assert.ok(match, `unexpected tint ${tint}`);
  const [, first, share, second] = match;
  return Number(share) === 0 ? second : first;
}

assert.deepEqual(
  rampTicks.map((tick) => rampStopOf(tick.props.style.color)),
  RAMP,
  'each level lands on its ramp color, in order',
);

// A catalog entry can carry reasoning metadata without a level list; the seat
// must then render nothing rather than read the field that is not there.
for (const reasoning of [{}, { efforts: null }, { efforts: 'low' }, { efforts: [] }]) {
  const { ticks } = renderSlider([], { reasoning });
  assert.equal(
    ticks.length,
    0,
    `reasoning ${JSON.stringify(reasoning)}: no slider, no throw`,
  );
}

// Speed tiers follow the provider's catalog lists, not the mirrored predicate:
// gpt-6.1-sol is missing from the predicate yet its catalog offers every tier.
await new Promise((resolve) => setImmediate(resolve));
const seat = registered.find(({ options }) => options.name === 'conversation.input.model').component;
const useState = React.useState;
React.useState = (initial) => [initial === false ? true : initial, () => {}]; // menu and speed rows open
const menu = seat({
  locked: false,
  available: true,
  directory: {
    subscribe: () => () => {},
    getSnapshot: () => ({
      current: { provider: 'openai-codex', model: 'gpt-6.1-sol' },
      groups: [
        { id: 'openai-codex', name: 'ChatGPT subscription', models: [{ id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol' }] },
      ],
      failures: [],
      status: 'ready',
      pending: null,
      error: null,
    }),
  },
  load: () => {},
  select: () => Promise.resolve(true),
  setSpeedMode: () => Promise.resolve(true),
  refreshPrefs: () => {},
  t: (key) => key,
});
React.useState = useState;
const speedRows = [];
let speedValue;
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node === null || typeof node !== 'object') return;
  if (node.props?.key?.startsWith?.('speed:')) speedRows.push([node.props.key, node.props['aria-checked']]);
  if (node.props?.className === 'mfl-cellValue') speedValue = node.children[0];
  walk(node.children);
})(menu);
assert.deepEqual(
  speedRows,
  [
    ['speed:standard', false],
    ['speed:fast', true],
    ['speed:ultrafast', false],
  ],
  'gpt-6.1-sol offers every catalog tier, with the stored one checked',
);
assert.equal(speedValue, 'speed.fast', 'the speed row names the tier in effect');

// Host compatibility has to stay in step with what the bundle actually uses: DSH
// blocks installation on `peerDependencies`, so a client package added to the
// inject list without a pin would activate against any host version.
const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const pinned = manifest.peerDependencies ?? {};
for (const name of manifest.dsh.client.inject) {
  assert.ok(
    typeof pinned[name] === 'string' && pinned[name].length > 0,
    `${name} is injected but not pinned in peerDependencies`,
  );
}
assert.ok(
  Object.keys(pinned).length === manifest.dsh.client.inject.length,
  `peerDependencies pins exactly the injected packages: ${Object.keys(pinned).join(', ')}`,
);
assert.equal(manifest.engines?.node, '^22.19.0 || >=24.0.0', 'engines matches the host Node range');

console.log('client bundle loads, wires both seats, and tints one stop per level');
