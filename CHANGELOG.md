# Changelog

All notable changes to this bundle are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-15

### Fixed

- Reasoning metadata without a level list no longer throws during render: the
  slider simply does not appear for that model, the same as a model that
  advertises no levels. `check.mjs` covers a missing, null, non-array and empty
  `efforts` field.
- Cramped, uneven tick labels on models with six or more levels. The end labels
  were anchored to the block's edges while the rest were centred, so the gaps
  differed and the marks sat off their stops; every stop is now centred on its
  own offset, the track widens with the level count (150px base, +26px per extra
  stop, capped at 230px) and the ends have reserved room.

### Changed

- Thinner effort bar. The track and thumb are drawn by the bundle (3px track,
  9px thumb, filled up to the thumb's centre) instead of coming from the native
  range control, whose own track and thumb size cannot be reduced by shrinking
  its box. The label row is 14px: the mark, a 2px gap, then the name.
- The track past the selected level is drawn in the quieter label tone
  (`--dsw-alias-label-caption`) rather than the label color, so the filled part
  up to the thumb is the only strong element.
- The level labels carry their ramp color plainly: `TINT_STRENGTH` is 100 (the
  palette hex itself, no longer mixed toward the label color) and the text is
  10px at weight 500, so the color survives 9px-style antialiasing instead of
  reading as a tint of the surrounding text.
- The effort caption in the model button is sized by its content again, as the
  shipped control sizes it, instead of a fixed `4.5em` box with right-aligned
  text. A chip painted on that label by another plugin now hugs the text and
  stays centred; in exchange the button's left edge follows the caption's length,
  which the right-anchored tool row absorbs, and the model name ellipsises
  sooner when the caption is long.

### Added

- Level labels are tinted from the lowest level to the highest along a fixed
  six-color ramp — `#475569`, `#2563EB`, `#4F46E5`, `#6D28D9`, `#7E22CE`,
  `#86198F` — set by `TINT_RAMP`. The labels interpolate across it, so any level
  count is covered rather than a color repeating, and six levels land one label
  on each color in order.
- Every tint mixes toward the label color by `TINT_STRENGTH`, which is what keeps
  these hex hues readable in both palettes; `check.mjs` asserts one distinct tint
  per level at 4, 6 and 8 levels, and the exact palette at six.

## [1.0.0] - 2026-10-15

### Added

- The composer's model control opens the provider-grouped model list directly as
  the menu's first level: check mark on the current model, the catalog
  description under a model that has one, search once the catalog holds more
  than four models, and <kbd>↑</kbd>/<kbd>↓</kbd> plus <kbd>Esc</kbd> navigation
  (`conversation.input.model`, shadowing priority `-20`).
- Reasoning effort as a slider on the model control's right
  (`conversation.input.activity`): one tick and one name per level the current
  model advertises, a fixed 150px track with no reflow when the level changes,
  and one submission per gesture. Hidden for models without reasoning metadata
  or with a single level.
- The provider's speed tiers are offered in the same menu, read from and written
  to the settings entry the provider plugin itself uses.
- The provider plugin's `disabledModels` preference is honoured, so models it
  hides stay hidden, and edits made there follow without a page reload.
- `node check.mjs`: a smoke check that loads the bundle and asserts its module
  registration id, inject contract, and both seat registrations.

[Unreleased]: https://github.com/baicaihenxiao/dsh-model-effort-picker/commits/main
[1.1.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.0
[1.0.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.0.0
