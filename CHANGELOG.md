# Changelog

All notable changes to this bundle are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Shorter effort slider: a 10px control with 8px level names, one-pixel tick
  marks, and a 9px label row, replacing the 12px/9px geometry.

### Added

- Level labels are tinted from the lowest level to the highest, with four
  schemes shipping in `client.js` (`mono`, the active one, plus `heat`,
  `severity` and `warm`) selected by `TINT_SCHEME`. `mono` uses no hue at all:
  the labels just gain contrast level by level. Every tint mixes toward the label
  color by `TINT_STRENGTH` to keep the small text legible in both palettes.
- The ramp interpolates between its stops, so a model advertising more than four
  levels gets in-between hues rather than a repeated color; `check.mjs` asserts
  one distinct tint per level at 4, 6 and 8 levels.

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
[1.0.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.0.0
