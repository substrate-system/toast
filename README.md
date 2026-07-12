# toast
[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/toast/nodejs.yml?style=flat-square)](https://github.com/substrate-system/toast/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/toast?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![install size](https://flat.badgen.net/packagephobia/install/@bicycle-codes/keys?cache-control=no-cache)](https://packagephobia.com/result?p=@bicycle-codes/keys)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/toast)](https://bundlephobia.com/package/@substrate-system/toast)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


[Toasts](https://shoelace.style/components/alert/) as a web component.

[See a live demo](https://substrate-system.github.io/toast/)

<!-- toc -->

- [Install](#install)
- [API](#api)
  * [ESM](#esm)
  * [Common JS](#common-js)
- [Example](#example)
  * [Positioning](#positioning)
- [Attributes](#attributes)
  * [`open`](#open)
  * [`timeout`](#timeout)
  * [`noclose`](#noclose)
  * [`notimer`](#notimer)
  * [`position`](#position)
    + [Stacking](#stacking)
  * [Variants](#variants)
- [Events](#events)
  * [`substrate-toast:show`](#substrate-toastshow)
  * [`substrate-toast:hide`](#substrate-toasthide)
- [Methods](#methods)
  * [`toast()`](#toast)
  * [`hide()`](#hide)
- [CSS](#css)
  * [Import CSS](#import-css)
  * [CSS Variables](#css-variables)
    + [Layout & Typography](#layout--typography)
    + [Stacking & Position](#stacking--position)
    + [Primary Variant](#primary-variant)
    + [Success Variant](#success-variant)
    + [Neutral Variant](#neutral-variant)
    + [Warning Variant](#warning-variant)
    + [Danger Variant](#danger-variant)
    + [CSS Variable Example](#css-variable-example)
    + [Fixed Values](#fixed-values)
- [Use](#use)
  * [JS](#js)
  * [HTML](#html)
  * [pre-built](#pre-built)
    + [copy](#copy)
    + [HTML Example](#html-example)

<!-- tocstop -->

## Install

```sh
npm i -S @substrate-system/toast
```

## API

This exposes ESM and common JS via [package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import { SubstrateToast } from '@substrate-system/toast'
```

### Common JS
```js
const Toast = require('@substrate-system/toast')
```

## Example

```ts
import '@substrate-system/toast'

// Create a toast element
const toast = document.createElement('substrate-toast')
toast.textContent = 'Operation completed successfully!'
toast.setAttribute('success', '')
toast.setAttribute('timeout', '5000')
document.body.appendChild(toast)

// Show the toast
toast.toast()
```

### Positioning

Set the `position` attribute to change where toasts anchor (default is
`top-right`). See [`position`](#position) below for all six values and
the stacking behavior.

```html
<substrate-toast position="bottom-center">
    Anchored to bottom center
</substrate-toast>
```

## Attributes

### `open`
**Type:** Boolean
**Default:** `false`

Automatically displays the toast when the component is connected to the DOM.

```html
<substrate-toast open>
    Message will show immediately
</substrate-toast>
```

### `timeout`
**Type:** Number (milliseconds)
**Default:** `3000`

Controls how long the toast is displayed before automatically hiding.
Set to `0` for infinite display (toast will not auto-hide). When
`noclose` is present, timeout is automatically set to infinite.

```html
<substrate-toast timeout="5000">Shows for 5 seconds</substrate-toast>

<substrate-toast timeout="0">
    Shows until manually closed
</substrate-toast>
```

### `noclose`
**Type:** Boolean
**Default:** `false`

When present, hides the close button and prevents manual dismissal. When
absent, shows a close button that lets users manually dismiss the toast.
It also sets timeout to infinite.

```html
<substrate-toast noclose>
    Message without close button
</substrate-toast>

<substrate-toast>
    Message with close button
</substrate-toast>
```

### `notimer`
**Type:** Boolean
**Default:** `false`

When present, hides the visual countdown timer. The timer shows as a
circular progress ring that shrinks clockwise as the timeout counts
down. It is only visible when a close button is present.

```html
<!-- With countdown timer (default) -->
<substrate-toast timeout="5000">
    Message with visual timer
</substrate-toast>

<!-- Without countdown timer -->
<substrate-toast timeout="5000" notimer>
    Message without visual timer
</substrate-toast>
```

### `position`

**Type:** String
**Default:** `top-right`
**Valid Values:** `top-right`, `top-left`, `bottom-right`,
`bottom-left`, `top-center`, `bottom-center`

Anchors the toast to one of six screen positions and determines the
stack direction.

#### Stacking

Multiple toasts in the same position stack instead of
overlapping: the newest toast is added furthest from the anchored edge,
and toasts already showing do not move when a new one is added. When a
toast is dismissed, the rest of its stack glides toward the anchored
edge.

`timeout="0"` and `noclose` toasts are sticky -- they stay until
dismissed manually and coexist with transient toasts; they no longer
block other toasts from showing.

```html
<substrate-toast position="bottom-left">Bottom left</substrate-toast>
<substrate-toast position="top-center">Top center</substrate-toast>
```

Positioning is controlled entirely by this attribute. Overriding
`top`/`bottom`/`left`/`inset-inline-end` on `substrate-toast` in your own
CSS no longer determines stack direction -- use `position` instead.

### Variants

**Type:** Boolean (mutually exclusive)
**Default:** `neutral`
**Valid Values:** `primary`, `success`, `neutral`, `warning`, `danger`

Determines the visual style and icon of the toast. Only one variant should
be present.

| Variant | Icon | Use Case |
|---------|------|----------|
| `primary` | Info circle | General information/announcements |
| `success` | Checkmark circle | Successful operations/confirmations |
| `neutral` | Info circle | Neutral/default messages |
| `warning` | Triangle alert | Warnings/cautions |
| `danger` | X circle | Errors/failures |

```html
<substrate-toast success>Operation successful!</substrate-toast>
<substrate-toast warning>Please review your settings.</substrate-toast>
<substrate-toast danger>An error occurred.</substrate-toast>
<substrate-toast primary>Information message.</substrate-toast>

<!-- Without close button -->
<substrate-toast success noclose>Operation successful!</substrate-toast>
```

## Events

[Use the static method `.event`](https://github.com/substrate-system/web-component?tab=readme-ov-file#listen-for-events)
to get namespaced event names for this component.


### `substrate-toast:show`
**Event Detail:** `{ variant: ToastVariant }`

Fired when the toast becomes visible (animation starts).

```js
import { SubstrateToast } from '@substrate-system/toast'
const toast = document.querySelector('substrate-toast')

toast.addEventListener(SubstrateToast.event('show'), (ev) => {
  console.log('Toast showing with variant:', ev.detail.variant)
})
```

### `substrate-toast:hide`
**Event Detail:** `{ variant: ToastVariant }`

Fired when the toast is being hidden (either from timeout or manual close).

```js
import { SubstrateToast } from '@substrate-system/toast'

const toast = document.querySelector('substrate-toast')
toast.addEventListener(SubstrateToast.event('hide'), (ev) => {
  console.log('Toast hidden with variant:', ev.detail.variant)
})
```

## Methods

### `toast()`
Display the toast. Multiple toasts can be visible at once -- see
[`position`](#position) for how simultaneous toasts stack.

```js
const toast = document.querySelector('substrate-toast')
toast.toast()
```

### `hide()`
Hide this toast. The rest of its position's stack reflows toward the
anchored edge.

```js
const toast = document.querySelector('substrate-toast')
toast.hide()
```

## CSS

### Import CSS

```js
import '@substrate-system/toast/css'
```

Or minified:
```js
import '@substrate-system/toast/css/min'
```

### CSS Variables

You can override these CSS variables:

#### Layout & Typography
- `--toast-padding` - Internal padding of the toast (default: `1rem`)
- `--toast-gap` - Gap between icon, content,
  and close button (default: `0.75rem`)
- `--toast-font-size` - Font size of toast content (default: `1rem`)
- `--toast-line-height` - Line height of toast content (default: `1.5`)
- `--toast-max-width` - Maximum width of the toast (default: `24rem`)
- `--toast-border` - Border color (default: `#0003`)

#### Stacking & Position
- `--toast-inset` - Distance from the anchored edge (default: `1rem`)

#### Primary Variant
- `--toast-primary-bg` - Background color (default: `#fff`)
- `--toast-primary-border` - Left border color (default: `#3b82f6`)
- `--toast-primary-text` - Text color (default: `#1e40af`)
- `--toast-primary-icon` - Icon color (default: `#3b82f6`)

#### Success Variant
- `--toast-success-bg` - Background color (default: `#fdfefd`)
- `--toast-success-border` - Left border color (default: `#10b981`)
- `--toast-success-text` - Text color (default: `#065f46`)
- `--toast-success-icon` - Icon color (default: `#10b981`)

#### Neutral Variant
- `--toast-neutral-bg` - Background color (default: `#f9fafb`)
- `--toast-neutral-border` - Left border color (default: `#6b7280`)
- `--toast-neutral-text` - Text color (default: `#374151`)
- `--toast-neutral-icon` - Icon color (default: `#6b7280`)

#### Warning Variant
- `--toast-warning-bg` - Background color (default: `#fbfaf6`)
- `--toast-warning-border` - Left border color (default: `#f59e0b`)
- `--toast-warning-text` - Text color (default: `#92400e`)
- `--toast-warning-icon` - Icon color (default: `#f59e0b`)

#### Danger Variant
- `--toast-danger-bg` - Background color (default: `#fff`)
- `--toast-danger-border` - Left border color (default: `#ef4444`)
- `--toast-danger-text` - Text color (default: `#991b1b`)
- `--toast-danger-icon` - Icon color (default: `#ef4444`)

#### CSS Variable Example

```css
substrate-toast {
    --toast-padding: 1.5rem;
    --toast-max-width: 30rem;
    --toast-success-bg: #e6f7ed;
    --toast-success-border: #22c55e;
}
```

#### Fixed Values

The gap between stacked toasts (12px) is currently fixed and not
CSS-overridable. This setting is documented here for reference and
future compatibility.


-------


## Use

This calls the global function `customElements.define`. Just import, then use
the tag in your HTML.

### JS
The default timeout is 3 seconds. Set the time in milliseconds by passing
in the `timeout` attribute. Use the `noclose` attribute to hide the close
button and prevent manual dismissal.

```js
import '@substrate-system/toast'

const el = document.querySelector('substrate-toast')

// programmatically show the toast
el?.toast()
```

### HTML
```html
<div>
    <substrate-toast timeout="4000">abc 123</substrate-toast>
</div>

<!-- No close button -->
<div>
    <substrate-toast timeout="4000" noclose>abc 123</substrate-toast>
</div>
```

### pre-built

This package exposes minified JS and CSS files too. Copy them to a location
that is accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/toast/dist/index.min.js ./public/substrate-toast.min.js
cp ./node_modules/@substrate-system/toast/dist/style.min.css ./public/substrate-toast.css
```

#### HTML Example

```html
<head>
    <link rel="stylesheet" href="./substrate-toast.css">
</head>
<body>
    <!-- ... -->
    <script type="module" src="./substrate-toast.min.js"></script>
</body>
```
