/**
 * Client half of `dsh-model-effort-picker`.
 *
 * It takes the composer's `conversation.input.model` seat at a priority below
 * the shipped selector (0) and below the codex-subscription override (-10), so
 * exactly one occupant renders. Unlike those, this occupant has no first-level
 * "Select model" row: opening the menu shows the provider-grouped model list
 * itself, with the provider speed entry beneath it. The current model's
 * reasoning levels also ride the composer tool row as a slider on the model
 * control's right (`conversation.input.activity`).
 *
 * All copy goes through the Client locale service; all styling uses theme
 * tokens. The module uses only the browser module table (`react`), so it needs
 * no harness Client package.
 */
window.__ModuleLoader__.load({
  id: 'dsh-model-effort-picker',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'modelEffortPicker';

    const zh = {
      'trigger.placeholder': '选择模型',
      'trigger.aria': '选择模型，当前 {model}',
      'trigger.ariaEffort': '选择模型，当前 {model}，推理等级 {effort}',
      'menu.aria': '模型菜单',
      'menu.search': '搜索模型',
      'menu.loading': '正在加载模型…',
      'menu.loadError': '模型列表加载失败：{message}',
      'menu.retry': '重试',
      'menu.empty': '没有可用的模型',
      'menu.noMatch': '没有匹配的模型',
      'menu.effort': '推理等级',
      'menu.speed': '速度',
      'speed.standard': '标准',
      'speed.standardHint': '默认速度',
      'speed.fast': '快速',
      'speed.fastHint': '优先输出速度',
      'speed.ultrafast': '极速',
      'speed.ultrafastHint': '最高速度档位',
      'effort.providerDefault': '提供方默认',
      'effort.providerDefaultShort': '默认',
    };

    const en = {
      'trigger.placeholder': 'Select model',
      'trigger.aria': 'Select model, current {model}',
      'trigger.ariaEffort': 'Select model, current {model}, reasoning effort {effort}',
      'menu.aria': 'Model menu',
      'menu.search': 'Search models',
      'menu.loading': 'Loading models…',
      'menu.loadError': 'Could not load models: {message}',
      'menu.retry': 'Retry',
      'menu.empty': 'No models available',
      'menu.noMatch': 'No matching models',
      'menu.effort': 'Reasoning effort',
      'menu.speed': 'Speed',
      'speed.standard': 'Standard',
      'speed.standardHint': 'Default speed',
      'speed.fast': 'Fast',
      'speed.fastHint': 'Prioritize output speed',
      'speed.ultrafast': 'Ultrafast',
      'speed.ultrafastHint': 'Highest speed tier',
      'effort.providerDefault': 'Provider default',
      'effort.providerDefaultShort': 'Auto',
    };

    /**
     * Painted slider geometry, shared by the style sheet and the stop/fill math
     * so the two cannot drift: the track insets by the thumb's radius at each
     * end, and the thumb is centred on the track.
     */
    const THUMB_SIZE = 9;
    const TRACK_THICKNESS = 3;

    /** Track color past the selected level; one step quieter than the labels. */
    const TRACK_COLOR = 'var(--dsw-alias-label-caption)';

    /** Painted fill, behind the selected level and the thumb. */
    const FILL_COLOR = 'var(--dsw-alias-brand-primary)';

    const CSS = [
      '.mfl-root{position:relative;min-width:0}',
      '.mfl-trigger{border-radius:var(--dsw-radius-sm,6px);min-width:0;max-width:min(360px,45cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:none;border:0;outline:none;display:flex;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:400;line-height:20px}',
      '.mfl-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.mfl-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary))}',
      '.mfl-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}',
      '.mfl-triggerLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      // Sized by its content, like the shipped control's effort label: a fixed
      // width here would stretch anything that paints a background on it (a chip
      // from another plugin) and push the text off-centre.
      '.mfl-triggerEffort{min-width:0;flex-shrink:1000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}',
      '.mfl-triggerChevron{flex:none;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}',
      '.mfl-menu{position:absolute;right:0;bottom:calc(100% + 8px);z-index:1100;box-sizing:border-box;display:flex;flex-direction:column;width:max-content;min-width:min(240px,calc(100vw - 32px));max-width:min(420px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-shadow-lv3,var(--dsw-elevation-prominent));color:var(--dsw-alias-label-primary);overflow:hidden}',
      '.mfl-status,.mfl-empty{padding:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
      '.mfl-error,.mfl-failure{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:3px;padding:6px 7px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}',
      '.mfl-retry{flex:none;padding:0;border:0;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}',
      '.mfl-effort{display:flex;align-items:center;padding:0 6px;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary)}',
      '.mfl-effort:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.mfl-effortSlider{position:relative;box-sizing:border-box;flex:none;width:178px;padding:0 var(--mfl-pad,14px) 14px}',
      // The bar is drawn here rather than left to the native control: a native
      // range keeps its own track and thumb size, so a shorter box only clips
      // them instead of thinning them.
      '.mfl-effortRange{box-sizing:border-box;display:block;width:100%;height:12px;margin:0;cursor:pointer;appearance:none;background:transparent;accent-color:${FILL_COLOR}}',
      '.mfl-effortRange:disabled{cursor:default}',
      `.mfl-effortRange::-webkit-slider-runnable-track{height:${TRACK_THICKNESS}px;border-radius:2px;background:linear-gradient(to right,${FILL_COLOR} var(--mfl-fill,0%),${TRACK_COLOR} 0)}`,
      `.mfl-effortRange::-webkit-slider-thumb{appearance:none;width:${THUMB_SIZE}px;height:${THUMB_SIZE}px;margin-top:-${(THUMB_SIZE - TRACK_THICKNESS) / 2}px;border-radius:50%;background:${FILL_COLOR}}`,
      `.mfl-effortRange::-moz-range-track{height:${TRACK_THICKNESS}px;border-radius:2px;background:${TRACK_COLOR}}`,
      `.mfl-effortRange::-moz-range-progress{height:${TRACK_THICKNESS}px;border-radius:2px;background:${FILL_COLOR}}`,
      `.mfl-effortRange::-moz-range-thumb{width:${THUMB_SIZE}px;height:${THUMB_SIZE}px;border:0;border-radius:50%;background:${FILL_COLOR}}`,
      '.mfl-effortTicks{position:absolute;left:var(--mfl-pad,14px);right:var(--mfl-pad,14px);bottom:0;height:14px}',
      '.mfl-effortTick{position:absolute;bottom:0;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;line-height:10px;font-weight:500;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}',
      '.mfl-effortTick::before{content:"";display:block;width:1px;height:2px;background:currentColor}',
      '.mfl-searchRow{flex-shrink:0;margin:2px 0 3px}',
      '.mfl-search{box-sizing:border-box;width:100%;height:28px;padding:0 8px;border:1px solid transparent;border-radius:var(--dsw-radius-md,8px);background:transparent;color:inherit;font-size:12px;outline:none}',
      '.mfl-search::placeholder{color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}',
      '.mfl-search:focus-visible{border-color:var(--dsw-alias-border-l2)}',
      '.mfl-groups{min-height:0;overflow-y:auto}',
      '.mfl-groupHeading{position:sticky;top:0;padding:6px 8px 4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}',
      '.mfl-option{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:auto;min-width:100%;min-height:34px;padding:5px 7px;border:0;border-radius:var(--dsw-radius-md,8px);background:none;color:inherit;text-align:left;cursor:pointer;outline:none}',
      '.mfl-option:hover:not(:disabled),.mfl-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}',
      '.mfl-option:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}',
      '.mfl-optionCopy{display:flex;flex:1;flex-direction:column;min-width:0}',
      '.mfl-optionName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:400;line-height:18px}',
      '.mfl-optionDescription{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px}',
      '.mfl-mark{display:grid;place-items:center;flex:0 0 14px;height:14px;color:var(--dsw-alias-label-primary);font-size:12px}',
      '.mfl-effortSection{margin-top:3px;padding-top:3px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.mfl-cell{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:100%;min-width:100%;height:34px;padding:0 8px;border:0;border-radius:var(--dsw-radius-md,8px);background:none;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left;cursor:pointer;outline:none}',
      '.mfl-cell:hover,.mfl-cell:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}',
      '.mfl-cellLabel{flex:none;white-space:nowrap}',
      '.mfl-cellValue{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--dsw-alias-label-tertiary)}',
      '.mfl-cellChevron{flex:none;color:var(--dsw-alias-menu-icon,var(--dsw-alias-label-tertiary))}',
      '.mfl-effortRows{display:flex;flex-direction:column;padding-left:8px}',
    ].join('');

    /** Providers pinned ahead of the rest, in this order; everything else keeps catalog order. */
    const PROVIDER_RANK = { 'deepseek-account': 0, 'deepseek-official': 1 };

    /**
     * Settings entry that owns this provider's picker preferences. The plugin
     * that registers the provider applies them to its own composer menu; this
     * seat override reads and writes the same document through the harness
     * settings API, so both menus show one truth instead of a second copy.
     * The settings namespace is the loader entry id, so accept both the plain
     * row id and an `include:` row naming it.
     */
    const PROVIDER_NS = 'codex-subscription';

    const ownsProviderPrefs = (ns) =>
      typeof ns === 'string' && (ns === PROVIDER_NS || ns.endsWith(`:${PROVIDER_NS}`));

    /**
     * The provider preferences this menu honours: models it hides, its speed
     * mode, the namespace to write back to, and whether writes are accepted.
     */
    const providerPrefs = {
      value: Object.freeze({
        hidden: Object.freeze([]),
        ns: undefined,
        speedMode: undefined,
        writable: false,
      }),
      listeners: new Set(),
    };

    function publishProviderPrefs(next) {
      providerPrefs.value = Object.freeze(next);
      for (const listener of providerPrefs.listeners) listener();
    }

    const subscribeProviderPrefs = (listener) => {
      providerPrefs.listeners.add(listener);
      return () => providerPrefs.listeners.delete(listener);
    };

    const getProviderPrefs = () => providerPrefs.value;

    /**
     * Level ramp, lowest level first: slate → blue → indigo → violet → purple →
     * magenta. Six stops, and the labels are interpolated across them, so any
     * level count is covered — an adapter with exactly six levels lands each
     * label on one of these colors.
     */
    const TINT_RAMP = [
      '#475569',
      '#2563EB',
      '#4F46E5',
      '#6D28D9',
      '#7E22CE',
      '#86198F',
    ];

    /**
     * Share of the ramp color kept in the label text; the remainder goes to the
     * label color. At 100 the palette renders exactly as given, which is the
     * most visible on the light palette; below that every stop is pulled toward
     * the label color, which is near-black on light and near-white on dark — the
     * lever to reach for when the labels look dim against a dark background.
     */
    const TINT_STRENGTH = 100;

    /**
     * Interpolate a ramp at one position, using nested `color-mix` so the ramp
     * works for any level count and both palettes.
     * @param stops - ramp colors, lowest level first.
     * @param ratio - 0 at the lowest level, 1 at the highest.
     * @returns the CSS color at that position.
     */
    function rampAt(stops, ratio) {
      if (stops.length < 2) return stops[0];
      const scaled = Math.min(1, Math.max(0, ratio)) * (stops.length - 1);
      const lower = Math.min(stops.length - 2, Math.floor(scaled));
      return `color-mix(in oklab, ${stops[lower + 1]} ${Math.round((scaled - lower) * 100)}%, ${stops[lower]})`;
    }

    /**
     * Tint for one level label.
     * @param index - level position, lowest first.
     * @param count - number of levels.
     * @returns a CSS color for the tick label and its mark.
     */
    function effortTint(index, count) {
      const ratio = count < 2 ? 1 : index / (count - 1);
      const ramp = rampAt(TINT_RAMP, ratio);
      // A full-strength tint needs no mixing: the ramp color is the color.
      if (TINT_STRENGTH >= 100) return ramp;
      return `color-mix(in oklab, ${ramp} ${TINT_STRENGTH}%, var(--dsw-alias-label-primary))`;
    }

    /** Horizontal room one end label needs, so centring it stays inside the box. */
    const END_LABEL_ROOM = 14;

    /**
     * Track length for a level count: the base length fits four levels, and each
     * extra level widens the track so its label keeps its distance.
     * @param count - number of levels.
     * @returns a track length in pixels.
     */
    function trackLength(count) {
      return count <= 4 ? 150 : Math.min(230, 150 + (count - 4) * 26);
    }

    /**
     * One stop's offset inside the track — the same geometry as the painted fill,
     * so a tick sits under the thumb that stops there.
     * @param index - level position, lowest first.
     * @param count - number of levels.
     * @returns a CSS length for the stop.
     */
    function stopOffset(index, count) {
      const ratio = count < 2 ? 0 : index / (count - 1);
      return `calc(${THUMB_SIZE / 2}px + (100% - ${THUMB_SIZE}px) * ${ratio.toFixed(4)})`;
    }

    /**
     * Whether a model advertises the provider's fast mode. The provider applies
     * its own host-supplied list first and falls back to this predicate.
     * ponytail: predicate mirrored from the provider plugin, which keeps it in
     * its client bundle; drop the mirror if it ever exposes the list publicly.
     */
    const supportsFastMode = (modelId) =>
      typeof modelId === 'string' &&
      (/^gpt-5\.(?:5|6)(?:$|-)/u.test(modelId) ||
        modelId === 'gpt-5.4' ||
        modelId === 'gpt-6-astra');

    /** Stable provider order: DeepSeek account, then DeepSeek, then catalog order. */
    function orderProviders(groups) {
      return [...groups].sort(
        (left, right) => (PROVIDER_RANK[left.id] ?? 2) - (PROVIDER_RANK[right.id] ?? 2),
      );
    }

    /** One 14px stroke glyph built from a single path, colored by `currentColor`. */
    function strokeIcon(key, path, className) {
      return h(
        'svg',
        {
          key,
          viewBox: '0 0 14 14',
          width: 14,
          height: 14,
          className,
          'aria-hidden': true,
          focusable: false,
        },
        h('path', {
          d: path,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    const checkIcon = () => strokeIcon('check', 'M2.8 7.4l3 3 5.4-6');
    const chevronRight = () => strokeIcon('chevron', 'M5.2 3l4 4-4 4', 'mfl-cellChevron');
    const chevronDown = () =>
      strokeIcon('chevron', 'M3.5 5.5L7 9l3.5-3.5', 'mfl-triggerChevron');

    /**
     * Composer model seat whose menu opens on the model list itself.
     * @param props - owner `locked`, the injected directory face, and `t`.
     * @returns the trigger and, while open, the first-level model menu.
     */
    function ModelFirstLevel({ locked, available, directory, load, select, setSpeedMode, t }) {
      const state = React.useSyncExternalStore(directory.subscribe, directory.getSnapshot);
      const [open, setOpen] = React.useState(false);
      const [query, setQuery] = React.useState('');
      const [speedOpen, setSpeedOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      const triggerRef = React.useRef(null);
      const searchRef = React.useRef(null);
      const id = React.useId();

      React.useEffect(() => {
        if (available) load();
      }, [available, load]);

      const prefs = React.useSyncExternalStore(subscribeProviderPrefs, getProviderPrefs);
      const hidden = React.useMemo(() => new Set(prefs.hidden), [prefs.hidden]);
      const groups = React.useMemo(
        () =>
          orderProviders(state.groups)
            .map((group) => ({
              ...group,
              models: group.models.filter((model) => !hidden.has(model.id)),
            }))
            .filter((group) => group.models.length > 0),
        [state.groups, hidden],
      );
      const modelCount = groups.reduce((count, group) => count + group.models.length, 0);
      const searchable = modelCount > 4;
      const needle = searchable ? query.trim().toLocaleLowerCase() : '';
      const shownGroups = React.useMemo(() => {
        if (needle === '') return groups;
        return groups
          .map((group) => ({
            ...group,
            models: group.models.filter((model) =>
              [model.name, model.id, model.description, group.name].some(
                (text) => typeof text === 'string' && text.toLocaleLowerCase().includes(needle),
              ),
            ),
          }))
          .filter((group) => group.models.length > 0);
      }, [groups, needle]);

      const current = state.current;
      const currentModel = React.useMemo(() => {
        if (current === null || current === undefined) return undefined;
        return groups
          .find((group) => group.id === current.provider)
          ?.models.find((model) => model.id === current.model);
      }, [groups, current]);
      const reasoning = currentModel?.reasoning;
      const effectiveEffort = current?.reasoningEffort ?? reasoning?.defaultEffort;
      const effortLabel =
        reasoning === undefined
          ? state.retainedEffort
          : effectiveEffort === undefined
            ? t('effort.providerDefault')
            : (reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ??
              effectiveEffort);
      const modelLabel = currentModel?.name ?? current?.model ?? t('trigger.placeholder');

      const speedMode = prefs.speedMode;
      const speedModeLabel = {
        standard: t('speed.standard'),
        fast: t('speed.fast'),
        ultrafast: t('speed.ultrafast'),
      };
      const fastSupported =
        current?.provider === 'openai-codex' && supportsFastMode(current?.model);
      const speedChoices = React.useMemo(() => {
        if (current?.provider !== 'openai-codex') return [];
        const modes = [
          {
            key: 'speed:standard',
            mode: 'standard',
            label: t('speed.standard'),
            description: t('speed.standardHint'),
          },
        ];
        if (fastSupported) {
          modes.push({
            key: 'speed:fast',
            mode: 'fast',
            label: t('speed.fast'),
            description: t('speed.fastHint'),
          });
        }
        // Ultrafast is advertised only by the provider's host list, which this
        // seat cannot read; keep the current tier selectable when it is one.
        if (speedMode === 'ultrafast') {
          modes.push({
            key: 'speed:ultrafast',
            mode: 'ultrafast',
            label: t('speed.ultrafast'),
            description: t('speed.ultrafastHint'),
          });
        }
        return modes;
      }, [current, fastSupported, speedMode, t]);

      const busy = state.status === 'selecting';
      const pending = state.pending ?? null;

      const close = (restoreFocus) => {
        setOpen(false);
        setQuery('');
        setEffortOpen(false);
        setSpeedOpen(false);
        if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
      };

      React.useEffect(() => {
        if (!open) return undefined;
        const onMouseDown = (event) => {
          if (!rootRef.current?.contains(event.target)) close(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
      }, [open]);

      React.useEffect(() => {
        if (!open) return;
        const target =
          (searchable ? searchRef.current : null) ??
          rootRef.current?.querySelector('.mfl-option[aria-checked="true"]') ??
          rootRef.current?.querySelector('.mfl-option');
        target?.focus();
      }, [open, searchable]);

      if (!available) return null;

      const chooseModel = (group, model) => {
        if (busy) return;
        if (current?.provider === group.id && current.model === model.id) {
          close(true);
          return;
        }
        const effort = model.reasoning?.defaultEffort;
        select({
          provider: group.id,
          model: model.id,
          ...(effort === undefined ? {} : { reasoningEffort: effort }),
        }).then((ok) => {
          if (ok) close(true);
        });
      };

      const chooseSpeed = (mode) => {
        if (mode === speedMode) {
          close(true);
          return;
        }
        setSpeedMode(mode).then((ok) => {
          if (ok) close(true);
        });
      };

      const onKeyDown = (event) => {
        if (!open) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          if (speedOpen) setSpeedOpen(false);
          else close(true);
          return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const rows = Array.from(
          rootRef.current?.querySelectorAll('.mfl-option:not(:disabled),.mfl-cell:not(:disabled)') ??
            [],
        );
        if (rows.length === 0) return;
        event.preventDefault();
        const index = rows.indexOf(document.activeElement);
        const next =
          event.key === 'ArrowDown'
            ? (index + 1) % rows.length
            : index <= 0
              ? rows.length - 1
              : index - 1;
        rows[next]?.focus();
      };

      const option = ({ key, label, description, selected, disabled, onClick }) =>
        h(
          'button',
          {
            key,
            type: 'button',
            role: 'menuitemradio',
            'aria-checked': selected,
            className: 'mfl-option',
            disabled,
            onClick,
          },
          h(
            'span',
            { className: 'mfl-optionCopy' },
            h('span', { className: 'mfl-optionName' }, label),
            description === undefined
              ? null
              : h('span', { className: 'mfl-optionDescription' }, description),
          ),
          h('span', { className: 'mfl-mark' }, selected ? checkIcon() : null),
        );

      return h(
        'div',
        { className: 'mfl-root', ref: rootRef, onKeyDown },
        h(
          'button',
          {
            ref: triggerRef,
            type: 'button',
            className: 'mfl-trigger',
            'aria-label':
              effortLabel === undefined
                ? t('trigger.aria', { model: modelLabel })
                : t('trigger.ariaEffort', { model: modelLabel, effort: effortLabel }),
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            'aria-controls': open ? `${id}-menu` : undefined,
            title: modelLabel,
            disabled: locked,
            onClick: () => {
              if (open) close(true);
              else {
                setOpen(true);
                load();
              }
            },
          },
          h('span', { className: 'mfl-triggerLabel' }, modelLabel),
          effortLabel === undefined
            ? null
            : h('span', { className: 'mfl-triggerEffort' }, effortLabel),
          chevronDown(),
        ),
        open
          ? h(
              'div',
              {
                className: 'mfl-menu',
                id: `${id}-menu`,
                role: 'menu',
                'aria-label': t('menu.aria'),
                onKeyDown,
              },
              state.status === 'loading'
                ? h('div', { className: 'mfl-status' }, t('menu.loading'))
                : null,
              state.error === null || state.error === undefined
                ? null
                : h(
                    'div',
                    { className: 'mfl-error' },
                    h('span', null, t('menu.loadError', { message: state.error })),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'mfl-retry',
                        onClick: () => load(),
                      },
                      t('menu.retry'),
                    ),
                  ),
              ...state.failures.map((failure) =>
                h('div', { className: 'mfl-failure', key: `failure:${failure.id}` }, failure.message),
              ),
              searchable
                ? h(
                    'div',
                    { className: 'mfl-searchRow' },
                    h('input', {
                      ref: searchRef,
                      type: 'search',
                      className: 'mfl-search',
                      value: query,
                      placeholder: t('menu.search'),
                      'aria-label': t('menu.search'),
                      autoComplete: 'off',
                      onChange: (event) => setQuery(event.target.value),
                    }),
                  )
                : null,
              h(
                'div',
                { className: 'mfl-groups' },
                shownGroups.length === 0
                  ? h(
                      'div',
                      { className: 'mfl-empty' },
                      needle === '' ? t('menu.empty') : t('menu.noMatch'),
                    )
                  : shownGroups.map((group) =>
                      h(
                        'div',
                        { className: 'mfl-group', key: group.id },
                        h('div', { className: 'mfl-groupHeading' }, group.name),
                        ...group.models.map((model) => {
                          const selected =
                            current?.provider === group.id && current.model === model.id;
                          const waiting =
                            pending !== null &&
                            pending.provider === group.id &&
                            pending.model === model.id;
                          return h(
                            'button',
                            {
                              key: model.id,
                              type: 'button',
                              role: 'menuitemradio',
                              'aria-checked': selected,
                              className: 'mfl-option',
                              disabled: busy,
                              onClick: () => chooseModel(group, model),
                            },
                            h(
                              'span',
                              { className: 'mfl-optionCopy' },
                              h('span', { className: 'mfl-optionName' }, model.name),
                              model.description === undefined
                                ? null
                                : h(
                                    'span',
                                    { className: 'mfl-optionDescription' },
                                    model.description,
                                  ),
                            ),
                            h(
                              'span',
                              { className: 'mfl-mark' },
                              waiting ? '…' : selected ? checkIcon() : null,
                            ),
                          );
                        }),
                      ),
                    ),
              ),
              speedChoices.length === 0
                ? null
                : h(
                    'div',
                    { className: 'mfl-effortSection' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'mfl-cell',
                        'aria-expanded': speedOpen,
                        onClick: () => setSpeedOpen((value) => !value),
                      },
                      h('span', { className: 'mfl-cellLabel' }, t('menu.speed')),
                      h(
                        'span',
                        { className: 'mfl-cellValue' },
                        speedModeLabel[speedMode] ?? speedMode ?? '',
                      ),
                      chevronRight(),
                    ),
                    speedOpen
                      ? h(
                          'div',
                          { className: 'mfl-effortRows', role: 'group' },
                          speedChoices.map((choice) =>
                            option({
                              key: choice.key,
                              label: choice.label,
                              description: choice.description,
                              selected: speedMode === choice.mode,
                              disabled: !prefs.writable,
                              onClick: () => chooseSpeed(choice.mode),
                            }),
                          ),
                        )
                      : null,
                  ),
            )
          : null,
      );
    }

    /**
     * Composer reasoning-effort slider, `conversation.input.activity`.
     *
     * The composer renders that seat after the model control, which is where
     * the slider belongs; it never reports itself active, so the row keeps its
     * standard controls instead of expanding for it.
     *
     * The current model's advertised levels are the slider's discrete stops, in
     * the adapter's own order, with an extra "provider default" stop when the
     * adapter leaves the default open. It renders nothing for a model without
     * reasoning metadata or with a single level, and submits through the same
     * per-session directory the model seat uses.
     *
     * The thumb follows the gesture locally and commits once per gesture (pointer
     * release, key release, or blur): the stored value only moves after the Host
     * accepts the selection, so a per-notch commit would fight the drag and a
     * busy gate would cancel it mid-gesture.
     * @param props - the injected directory face and `t`.
     * @returns the labelled slider, or null when the model has no choice.
     */
    function EffortSlider({ locked, available, directory, load, select, t }) {
      const state = React.useSyncExternalStore(directory.subscribe, directory.getSnapshot);
      const [drag, setDrag] = React.useState(null);
      const current = state.current;
      const model = React.useMemo(() => {
        if (current === null || current === undefined) return undefined;
        return state.groups
          .find((group) => group.id === current.provider)
          ?.models.find((entry) => entry.id === current.model);
      }, [state.groups, current]);
      const reasoning = model?.reasoning;
      const levels = React.useMemo(() => {
        // Metadata that carries no level list is a model with no choice to
        // offer, so the seat renders nothing rather than reading a field that
        // is not there.
        if (!Array.isArray(reasoning?.efforts)) return [];
        const named = reasoning.efforts.map((level) => ({
          id: level.id,
          name: level.name,
          tick: level.name,
        }));
        return reasoning.defaultEffort === undefined
          ? [
              {
                id: undefined,
                name: t('effort.providerDefault'),
                tick: t('effort.providerDefaultShort'),
              },
              ...named,
            ]
          : named;
      }, [reasoning, t]);
      const modelKey = current === null || current === undefined ? '' : `${current.provider}/${current.model}`;

      React.useEffect(() => {
        if (available) load();
      }, [available, load]);

      /** A different model owns different levels: drop any stale gesture. */
      React.useEffect(() => {
        setDrag(null);
      }, [modelKey]);

      /** The gesture ends once the stored effort is the one it asked for. */
      React.useEffect(() => {
        if (drag === null) return;
        const effective = current?.reasoningEffort ?? reasoning?.defaultEffort;
        if (effective === drag.id || state.status === 'error') setDrag(null);
      }, [drag, current, reasoning, state.status]);

      if (!available) return null;
      if (levels.length < 2) return null;

      const effective = current?.reasoningEffort ?? reasoning?.defaultEffort;
      const stored = Math.max(
        0,
        levels.findIndex((level) => level.id === effective),
      );
      const shown = drag?.index ?? stored;

      const commit = () => {
        if (drag === null || current === null || current === undefined) return;
        const level = levels[drag.index];
        if (level === undefined || level.id === effective) return;
        select({
          provider: current.provider,
          model: current.model,
          ...(level.id === undefined ? {} : { reasoningEffort: level.id }),
        });
      };

      return h(
        'label',
        { className: 'mfl-effort', title: t('menu.effort') },
        h(
          'span',
          {
            className: 'mfl-effortSlider',
            // More levels need a longer track, and the end labels need room of
            // their own so centring them does not push them outside the box.
            style: {
              '--mfl-pad': `${END_LABEL_ROOM}px`,
              width: `calc(${trackLength(levels.length)}px + 2 * var(--mfl-pad))`,
            },
          },
          h('input', {
            type: 'range',
            className: 'mfl-effortRange',
            min: 0,
            max: levels.length - 1,
            step: 1,
            value: shown,
            disabled: locked,
            // The painted fill ends where the thumb's centre sits.
            style: { '--mfl-fill': stopOffset(shown, levels.length) },
            'aria-label': t('menu.effort'),
            'aria-valuetext': levels[shown]?.name,
            onChange: (event) => setDrag({ index: Number(event.target.value), id: levels[Number(event.target.value)]?.id }),
            onPointerUp: commit,
            onKeyUp: commit,
            onBlur: commit,
          }),
          // Hand-drawn stops: the native datalist draws its label row outside
          // this control's box, so its width could not be pinned. Every stop is
          // centred on its own position — the ends included — so the gaps stay
          // uniform and each mark sits under the thumb's stop.
          h(
            'span',
            { className: 'mfl-effortTicks', 'aria-hidden': true },
            levels.map((level, index) =>
              h(
                'span',
                {
                  key: level.id ?? 'default',
                  className: 'mfl-effortTick',
                  style: {
                    color: effortTint(index, levels.length),
                    left: stopOffset(index, levels.length),
                    transform: 'translateX(-50%)',
                  },
                },
                level.tick ?? level.name,
              ),
            ),
          ),
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'modelDirectories', 'sessions', 'remote', 'remote.settings'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, { zh, en }),
          'dsh-model-effort-picker: dictionaries',
        );
        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = 'dsh-model-effort-picker';
          tag.textContent = CSS;
          document.head.append(tag);
          return () => tag.remove();
        }, 'dsh-model-effort-picker: styles');

        const modelDirectories = ctx.get('modelDirectories');
        const sessions = ctx.get('sessions');
        const remote = ctx.get('remote');
        if (modelDirectories === undefined || sessions === undefined || remote === undefined) return;

        /** Re-read the provider's picker preferences into the shared store. */
        const refreshProviderPrefs = () => {
          remote.settings.describe().then(
            (response) => {
              if (response?.ok !== true) return;
              const entry = response.value?.namespaces?.find((namespace) =>
                ownsProviderPrefs(namespace.ns),
              );
              const disabled = entry?.value?.disabledModels;
              const speedMode = entry?.value?.speedMode;
              publishProviderPrefs({
                hidden: Object.freeze(
                  Array.isArray(disabled) ? disabled.filter((id) => typeof id === 'string') : [],
                ),
                ns: entry?.ns,
                speedMode: typeof speedMode === 'string' ? speedMode : undefined,
                writable: entry !== undefined && response.value?.writable === true,
              });
            },
            () => {},
          );
        };

        /**
         * Write one provider preference through the same settings entry the
         * provider reads, so its own menu and this one cannot diverge.
         * @param mode - the speed tier to store.
         * @returns whether the write was accepted.
         */
        const setSpeedMode = (mode) => {
          const ns = getProviderPrefs().ns;
          if (ns === undefined) return Promise.resolve(false);
          return remote.settings.update(ns, { speedMode: mode }, undefined).then(
            (response) => {
              refreshProviderPrefs();
              return response?.ok === true;
            },
            () => false,
          );
        };

        ctx.effect(() => {
          refreshProviderPrefs();
          const off = remote.$on?.('settings/document-updated', (namespace) => {
            if (ownsProviderPrefs(namespace)) refreshProviderPrefs();
          });
          return () => {
            if (typeof off === 'function') off();
          };
        }, 'dsh-model-effort-picker: provider preferences');

        /**
         * Business face shared by both seats: this session's model directory,
         * its selection verb, and the provider speed write.
         * @param sessionId - the seat's session.
         * @returns the injected props both components consume.
         */
        const face = (sessionId) => {
          const directory = modelDirectories.directoryFor(sessionId);
          const available = sessions.subagentAddress(sessionId) === undefined;
          return {
            available,
            directory: directory.store,
            load: () => {
              if (!available) return;
              directory.load()?.catch(() => {});
            },
            select: (selection) =>
              available
                ? directory.select(selection).then(
                    (result) => result?.ok !== false,
                    () => false,
                  )
                : Promise.resolve(false),
            setSpeedMode,
          };
        };

        ctx.slots.inject('conversation.input.model', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.model',
              priority: -20,
              locale: NS,
              inject: face,
            },
            ModelFirstLevel,
          ),
        );

        // The composer tool row renders `conversation.input.right` BEFORE the
        // model seat and only `conversation.input.activity` after it, so the
        // slider lives here to sit on the model control's right. It never
        // reports itself active, so the row keeps its standard controls.
        ctx.slots.inject('conversation.input.activity', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.activity',
              locale: NS,
              inject: face,
            },
            EffortSlider,
          ),
        );
      },
    };
  },
});
