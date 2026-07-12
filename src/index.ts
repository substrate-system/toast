import { WebComponent } from '@substrate-system/web-component'
import { define } from '@substrate-system/web-component/util'
import Debug from '@substrate-system/debug'
const debug = Debug('toast')

export type ToastVariant = 'primary'|'success'|'neutral'|'warning'|'danger'

// Event detail types
export interface ToastShowDetail {
    variant:ToastVariant
}

export interface ToastHideDetail {
    variant:ToastVariant
}

// for document.querySelector
declare global {
    interface HTMLElementTagNameMap {
        'substrate-toast':SubstrateToast
    }

    interface HTMLElementEventMap {
        'substrate-toast:show':CustomEvent<ToastShowDetail>
        'substrate-toast:hide':CustomEvent<ToastHideDetail>
    }
}

export const VARIANTS:ToastVariant[] = [
    'primary',
    'success',
    'neutral',
    'warning',
    'danger'
]

const STACK_GAP = 12  // px; keep in sync with --toast-stack-gap in index.css

const POSITIONS = [
    'top-right', 'top-left', 'bottom-right',
    'bottom-left', 'top-center', 'bottom-center'
] as const

export type ToastPosition = typeof POSITIONS[number]

function isToastPosition (
    value:string|null
):value is ToastPosition {
    return POSITIONS.includes(value as ToastPosition)
}

// Toasts currently visible, in show order (append = newest)
const visibleToasts:SubstrateToast[] = []

export class SubstrateToast extends WebComponent.create('substrate-toast') {
    static observedAttributes = [
        'open',
        'noclose',
        'timeout',
        'notimer',
        'position',
        ...VARIANTS
    ]

    private _open = false
    private _variant:ToastVariant = 'neutral'
    private _noClose:boolean = false
    private _timeout = 6000
    private _showTimer:boolean = true
    private _timeoutId:number|null = null
    private _container:HTMLDivElement|null = null
    private _closeButton:HTMLButtonElement|null = null
    private _closeWrapper:HTMLDivElement|null = null
    private _progressCircle:SVGCircleElement|null = null
    private _progressSvg:SVGSVGElement|null = null
    private _startTime:number|null = null
    _position:ToastPosition = 'top-right'

    DEFAULT_TIMEOUT:number = 6000

    constructor () {
        super()
        if (this.hasAttribute('open')) {
            this._open = true
        }

        const timeoutAttr = this.getAttribute('timeout')
        if (timeoutAttr !== null) {  // if a timeout was passed in
            const timeout = parseInt(timeoutAttr)
            if (timeout === 0) {
                this._timeout = Infinity
            }
        }

        const positionAttr = this.getAttribute('position')
        this._position = isToastPosition(positionAttr) ?
            positionAttr :
            'top-right'

        this._showTimer = !(this.hasAttribute('notimer'))

        // set _variant
        VARIANTS.forEach(v => {
            if (this.hasAttribute(v)) {
                this._variant = v
            }
        })

        debug('constructing', this._variant)
    }

    connectedCallback () {
        this.render()

        if (this._open) {
            this.toast()
        }
    }

    disconnectedCallback () {
        const i = visibleToasts.indexOf(this)
        if (i !== -1) {
            visibleToasts.splice(i, 1)
            layoutToasts()
        }
    }

    async attributeChangedCallback (
        name:string,
        oldValue:string|null,
        newValue:string|null
    ) {
        super.attributeChangedCallback(
            name,
            oldValue as string,
            newValue as string
        )
        if (!VARIANTS.includes(name as ToastVariant)) return
        if (newValue !== null) {
            this._variant = name as ToastVariant
        } else {
            const activeVariant = VARIANTS.find(variant => {
                return this.hasAttribute(variant)
            })
            this._variant = activeVariant || 'neutral'
        }
        this._syncVariantUi()
    }

    /**
     * Method names like `handleChange_attribute` are called by the
     * `attributeChangedCallback` on the parent class.
     */
    handleChange_timeout (_oldValue:string, newValue:string) {
        const val = parseInt(newValue)
        // set _timeout to either infinity, or if NaN, then default
        this._timeout = val === 0 ? Infinity : (val || this.DEFAULT_TIMEOUT)
    }

    handleChange_noclose (_oldValue:string, newValue:string|null) {
        debug('in noclose handler', newValue)
        this._noClose = (newValue !== null)
        if (this._noClose) {
            this._timeout = Infinity
        } else {
            const timeoutAttr = this.getAttribute('timeout')
            if (timeoutAttr) {
                this._timeout = parseInt(timeoutAttr)
            } else {
                this._timeout = this.DEFAULT_TIMEOUT
            }
        }
    }

    handleChange_open (_oldValue:string, newValue:string|null) {
        this._open = newValue !== null
    }

    handleChange_notimer (_oldValue:string, newValue:string|null) {
        this._showTimer = (newValue === null)
    }

    handleChange_position (_oldValue:string, newValue:string|null) {
        this._position = isToastPosition(newValue) ?
            newValue :
            'top-right'
        layoutToasts()
    }

    /**
     * Show the toast, use the timeout attribute.
     */
    toast ():void {
        requestAnimationFrame(() => this._showToast())
    }

    /**
     * Internal method to actually show the toast and add it to the
     * visible-toast registry.
     */
    _showToast ():void {
        if (!visibleToasts.includes(this)) {
            visibleToasts.push(this)
        }
        this.classList.add('toast-visible')
        this.emit<ToastShowDetail>('show', {
            detail: { variant: this._variant }
        })
        layoutToasts()

        // Auto-hide after timeout
        if (this._timeout !== Infinity && this._timeout > 0) {
            this._startTime = Date.now()
            this._animateProgress()
            this._timeoutId = window.setTimeout(() => {
                this.emit('hide', {
                    detail: { variant: this._variant }
                })
                this.hide()
            }, this._timeout)
        }
    }

    /**
     * Animate the progress ring around the close button
     */
    _animateProgress ():void {
        if (!this._progressCircle || this._timeout === Infinity || !this._startTime) {
            return
        }

        const elapsed = Date.now() - this._startTime
        const progress = Math.min(elapsed / this._timeout, 1)

        // Update the stroke-dashoffset to create the countdown effect
        // Progress goes from 0 to 1, circle should start full and shrink to nothing
        const circumference = 2 * Math.PI * 10  // radius is 10
        const offset = circumference * progress
        this._progressCircle.style.strokeDashoffset = offset.toString()

        // Update aria-label with remaining time (update every second to avoid spam)
        if (this._progressSvg) {
            const remaining = Math.ceil((this._timeout - elapsed) / 1000)
            const currentLabel = this._progressSvg.getAttribute('aria-label')
            const newLabel = `Auto-dismiss in ${remaining} ${remaining === 1 ? 'second' : 'seconds'}`
            if (currentLabel !== newLabel) {
                this._progressSvg.setAttribute('aria-label', newLabel)
            }
        }

        if (progress < 1) {
            requestAnimationFrame(() => this._animateProgress())
        }
    }

    hide () {
        this.classList.remove('toast-visible')

        const i = visibleToasts.indexOf(this)
        if (i !== -1) {
            visibleToasts.splice(i, 1)
            layoutToasts()
        }

        // Wait for animation to complete
        setTimeout(() => {
            this.emit<ToastHideDetail>('hide', {
                detail: { variant: this._variant }
            })
        }, 300)

        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId)
            this._timeoutId = null
        }
    }

    getIconSvg ():string {
        const icons = {
            primary: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>`,
            success: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>`,
            neutral: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>`,
            warning: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>`,
            danger: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
            </svg>`
        }
        return icons[this._variant] || icons.neutral
    }

    _syncVariantUi () {
        if (!this._container) return

        this._container.className = `toast toast-${this._variant}`

        const icon = this._container.querySelector('.toast-icon')
        if (icon) {
            icon.innerHTML = this.getIconSvg()
        }
    }

    render () {
        // Don't re-render if already rendered
        if (this._container) return

        // Save existing content
        const existingContent = this.innerHTML

        this._container = document.createElement('div')
        this._container.setAttribute('role', 'status')
        this._container.setAttribute('aria-live', 'polite')
        this._container.setAttribute('aria-atomic', 'true')

        // Icon
        const icon = document.createElement('div')
        icon.className = 'toast-icon'
        this._container.appendChild(icon)

        // Content
        const content = document.createElement('div')
        content.className = 'toast-content'
        content.innerHTML = existingContent

        this._container.appendChild(content)

        // Render a close button unless `noclose` is present.
        if (!this._noClose) {
            // Create wrapper for close button and progress ring
            this._closeWrapper = document.createElement('div')
            this._closeWrapper.className = 'toast-close-wrapper'

            // Create the close button with X icon
            this._closeButton = document.createElement('button')
            this._closeButton.type = 'button'
            this._closeButton.className = 'toast-close'
            this._closeButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 6l12 12M6 18L18 6" />
                </svg>
            `
            this._closeButton.addEventListener('click', () => this.hide())

            // Create SVG with progress ring (separate from button) - only if
            // show-timer is enabled and timeout is not infinite
            if (this._showTimer && this._timeout !== Infinity) {
                this._progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                this._progressSvg.setAttribute('viewBox', '0 0 24 24')
                this._progressSvg.setAttribute('fill', 'none')
                this._progressSvg.setAttribute('role', 'timer')
                this._progressSvg.setAttribute('aria-label', `Auto-dismiss timer: ${this._timeout / 1000} seconds`)
                this._progressSvg.setAttribute('aria-live', 'off')
                this._progressSvg.classList.add('toast-progress-svg')

                // Progress circle (background)
                const progressBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                progressBg.setAttribute('cx', '12')
                progressBg.setAttribute('cy', '12')
                progressBg.setAttribute('r', '10')
                progressBg.classList.add('toast-progress-bg')
                this._progressSvg.appendChild(progressBg)

                // Progress circle (animated)
                this._progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                this._progressCircle.setAttribute('cx', '12')
                this._progressCircle.setAttribute('cy', '12')
                this._progressCircle.setAttribute('r', '10')
                this._progressCircle.classList.add('toast-progress-circle')
                this._progressSvg.appendChild(this._progressCircle)

                this._closeWrapper.appendChild(this._progressSvg)
            }
            this._closeWrapper.appendChild(this._closeButton)
            this._container.appendChild(this._closeWrapper)
        }

        // Clear and add container
        this.innerHTML = ''
        this.appendChild(this._container)
        this._syncVariantUi()
    }
}

define('substrate-toast', SubstrateToast)

function layoutToasts ():void {
    const groups = new Map<ToastPosition, SubstrateToast[]>()
    for (const t of visibleToasts) {
        const pos = t._position
        const list = groups.get(pos) || []
        list.push(t)
        groups.set(pos, list)
    }

    for (const [pos, list] of groups) {
        const sign = pos.startsWith('bottom') ? -1 : 1
        let offset = 0
        for (const t of list) {
            t.style.setProperty(
                '--toast-offset',
                (sign * offset) + 'px'
            )
            offset += t.offsetHeight + STACK_GAP
        }
    }
}
