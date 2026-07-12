import { test } from '@substrate-system/tapzero'
import { waitFor, click, sleep } from '@substrate-system/dom'
import { type SubstrateToast } from '../src/index.js'
import '../src/index.js'

// Load CSS for tests
const style = document.createElement('style')
style.textContent = `
substrate-toast {
    --toast-inset: 1rem;
    position: fixed;
    z-index: 1000;
}

substrate-toast:not([position]),
substrate-toast[position="top-left"],
substrate-toast[position="top-right"],
substrate-toast[position="top-center"] {
    top: var(--toast-inset);
}

substrate-toast[position="bottom-left"],
substrate-toast[position="bottom-right"],
substrate-toast[position="bottom-center"] {
    bottom: var(--toast-inset);
}

substrate-toast:not([position]),
substrate-toast[position="top-right"],
substrate-toast[position="bottom-right"] {
    inset-inline-end: var(--toast-inset);
}

substrate-toast[position="top-left"],
substrate-toast[position="bottom-left"] {
    left: var(--toast-inset);
    inset-inline-end: auto;
}

substrate-toast[position="top-center"],
substrate-toast[position="bottom-center"] {
    left: 50%;
    inset-inline-end: auto;
    --toast-x: -50%;
}
`
document.head.appendChild(style)

// ============================================================================
// Basic Rendering Tests
// ============================================================================

test('should render toast with SVG icon', async t => {
    clearToasts()
    document.body.innerHTML += `
        <substrate-toast timeout="5000" open>
            Test message
        </substrate-toast>
    `

    const el = await waitFor('substrate-toast svg')
    t.ok(el, 'Should find the inner svg icon')
})

test('should render all variant types correctly', async t => {
    clearToasts()
    const variants = ['primary', 'success', 'neutral', 'warning', 'danger']

    for (const variant of variants) {
        clearToasts()
        document.body.innerHTML =
            `<substrate-toast ${variant} open></substrate-toast>`
        const toast = await waitFor('substrate-toast')
        const container = toast?.querySelector(`.toast-${variant}`)
        t.ok(container, `Should have toast-${variant} class`)
    }
})

test('should render content from innerHTML', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast open>
            <strong>Bold text</strong> and normal text
        </substrate-toast>
    `

    const content = await waitFor('.toast-content')
    const strong = content?.querySelector('strong')
    t.ok(strong, 'Should preserve HTML content')
    t.equal(strong?.textContent, 'Bold text',
        'Should have correct text content')
})

// ============================================================================
// Attribute Tests
// ============================================================================

test('should have timeout attribute', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast timeout="500" open>
            Quick message
        </substrate-toast>
    `

    const toast = (await waitFor('substrate-toast'))! as SubstrateToast
    t.ok(toast, 'Toast should exist')
    t.equal(toast.getAttribute('timeout'), '500',
        'Should have timeout attribute')
})

test('should show close button by default', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast open>
            Message with close button
        </substrate-toast>
    `

    const closeButton = await waitFor('.toast-close')
    t.ok(closeButton, 'Should render close button')
})

test('should not show close button when noclose', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast noclose open>
            No close button
        </substrate-toast>
    `

    await waitFor('substrate-toast')
    const closeButton = document.querySelector('.toast-close')
    t.ok(!closeButton, 'Should not render close button')
})

// ============================================================================
// Interaction Tests
// ============================================================================

test('clicking close button should call hide', async t => {
    clearToasts()

    document.body.innerHTML = `
        <substrate-toast open timeout="0">
            Click to close
        </substrate-toast>
    `

    const toast = await waitFor('substrate-toast') as SubstrateToast
    t.ok(toast, 'Toast should exist')

    // Manually make it visible for testing
    toast.classList.add('toast-visible')

    // Click close button
    const closeButton = document.querySelector('.toast-close')! as HTMLElement
    t.ok(closeButton, 'Close button should exist')
    await click(closeButton)

    // Wait for hide animation
    await sleep(100)

    t.ok(!toast.classList.contains('toast-visible'),
        'Should not have visible class after close')
})

test('programmatic hide() should work', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast open timeout="0">
            Test message
        </substrate-toast>
    `

    const toast = await waitFor('substrate-toast') as SubstrateToast
    // Manually set visible for testing
    toast.classList.add('toast-visible')

    t.ok(toast.classList.contains('toast-visible'),
        'Should be visible initially')

    // Call hide programmatically
    toast.hide()

    t.ok(!toast.classList.contains('toast-visible'),
        'Should immediately remove visible class')
})

test('programmatic toast() method exists', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast timeout="0">
            Manual toast
        </substrate-toast>
    `

    const toast = await waitFor('substrate-toast') as SubstrateToast
    t.ok(toast, 'Toast should exist')
    t.equal(typeof toast.toast, 'function',
        'Should have toast() method')
    t.equal(typeof toast.hide, 'function',
        'Should have hide() method')
})

// ============================================================================
// Event Tests
// ============================================================================

test('should support custom event listeners', async t => {
    clearToasts()
    t.plan(3)

    document.body.innerHTML = `
        <substrate-toast success open timeout="0">
            Success message
        </substrate-toast>
    `

    const toast = await waitFor('substrate-toast') as SubstrateToast
    t.ok(toast, 'Toast should exist')

    let showEventFired = false
    toast.addEventListener('substrate-toast:show', ((e: CustomEvent) => {
        showEventFired = true
        t.equal(e.detail.variant, 'success',
            'Should emit show event with correct variant')
    }) as EventListener)

    // Manually trigger _showToast to test event
    ;(toast as any)._showToast()
    await sleep(10)
    t.ok(showEventFired, 'Show event should have fired')
})

test('should have warning variant', async t => {
    clearToasts()

    document.body.innerHTML = `
        <substrate-toast warning open timeout="500">
            Warning message
        </substrate-toast>
    `

    const toast = await waitFor('substrate-toast') as SubstrateToast
    t.ok(toast, 'Toast should exist')
    t.ok(toast.hasAttribute('warning'), 'Should have warning attribute')
})

test('should update variant class and icon when variant changes', async t => {
    clearToasts()

    const toast = document.createElement('substrate-toast')
    toast.textContent = 'Variant change'
    document.body.appendChild(toast)

    const inner = await waitFor('substrate-toast .toast')
    const icon = toast.querySelector('.toast-icon')
    const initialIcon = icon?.innerHTML

    toast.setAttribute('success', '')
    await Promise.resolve()

    t.ok(inner?.classList.contains('toast-success'),
        'Should update to the success class')
    t.notEqual(icon?.innerHTML, initialIcon,
        'Should update the icon for the new variant')
})

test('should return to neutral when variant attribute is removed', async t => {
    clearToasts()

    const toast = document.createElement('substrate-toast')
    toast.textContent = 'Variant removal'
    document.body.appendChild(toast)

    const inner = await waitFor('substrate-toast .toast')

    toast.setAttribute('success', '')
    await Promise.resolve()
    t.ok(inner?.classList.contains('toast-success'),
        'Should set the success class before removal')

    toast.removeAttribute('success')
    await Promise.resolve()

    t.ok(inner?.classList.contains('toast-neutral'),
        'Should fall back to the neutral class after removal')
})

// ============================================================================
// Stacking Tests
// ============================================================================

test('multiple transient toasts all become visible (no serialisation)', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="t1" timeout="3000">First</substrate-toast>
        <substrate-toast id="t2" timeout="3000">Second</substrate-toast>
    `
    await waitFor('#t1')
    const t1 = document.getElementById('t1') as SubstrateToast
    const t2 = document.getElementById('t2') as SubstrateToast

    t1.toast()
    t2.toast()
    await sleep(50)

    t.ok(t1.classList.contains('toast-visible'), 'First toast visible')
    t.ok(t2.classList.contains('toast-visible'), 'Second toast visible')
})

test('a sticky toast does not block a later transient toast', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="sticky" timeout="0">Sticky</substrate-toast>
    `
    await waitFor('#sticky')
    const sticky = document.getElementById('sticky') as SubstrateToast
    sticky.toast()
    await sleep(50)
    t.ok(sticky.classList.contains('toast-visible'), 'Sticky toast visible')

    // Use insertAdjacentHTML, not `innerHTML +=`: the latter serialises
    // and re-parses the whole body, detaching `sticky` (which is already
    // registered in visibleToasts) without ever calling disconnectedCallback
    // (that lands in Phase 4), leaking a stale entry into the registry
    // for the rest of the test run.
    document.body.insertAdjacentHTML('beforeend', `
        <substrate-toast id="transient" timeout="3000">Transient</substrate-toast>
    `)
    await waitFor('#transient')
    const transient = document.getElementById('transient') as SubstrateToast
    transient.toast()
    await sleep(50)

    t.ok(transient.classList.contains('toast-visible'),
        'Transient toast becomes visible while the sticky toast is still showing')
})

test('the second toast in a stack gets a non-zero offset, the first stays at 0', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="s1" timeout="0">First</substrate-toast>
        <substrate-toast id="s2" timeout="0">Second</substrate-toast>
    `
    await waitFor('#s1')
    const s1 = document.getElementById('s1') as SubstrateToast
    const s2 = document.getElementById('s2') as SubstrateToast

    s1.toast()
    await sleep(50)
    s2.toast()
    await sleep(50)

    t.equal(s1.style.getPropertyValue('--toast-offset'), '0px',
        'First toast sits at offset 0')
    const secondOffset = s2.style.getPropertyValue('--toast-offset')
    t.ok(secondOffset !== '' && secondOffset !== '0px',
        'Second toast has a non-zero offset')
})

test('the remaining toast reflows to offset 0 when the first is hidden', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="r1" timeout="0">First</substrate-toast>
        <substrate-toast id="r2" timeout="0">Second</substrate-toast>
    `
    await waitFor('#r1')
    const r1 = document.getElementById('r1') as SubstrateToast
    const r2 = document.getElementById('r2') as SubstrateToast

    r1.toast()
    await sleep(50)
    r2.toast()
    await sleep(50)

    r1.hide()

    t.equal(r2.style.getPropertyValue('--toast-offset'), '0px',
        'Second toast recomputes to offset 0 immediately after the first is hidden')
})

test('toasts in different positions get independent offset-0 groups', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="tr" position="top-right" timeout="0">TR</substrate-toast>
        <substrate-toast id="bl" position="bottom-left" timeout="0">BL</substrate-toast>
    `
    await waitFor('#tr')
    const tr = document.getElementById('tr') as SubstrateToast
    const bl = document.getElementById('bl') as SubstrateToast

    tr.toast()
    await sleep(50)
    bl.toast()
    await sleep(50)

    t.equal(tr.style.getPropertyValue('--toast-offset'), '0px',
        'top-right toast is at offset 0')
    t.equal(bl.style.getPropertyValue('--toast-offset'), '0px',
        'bottom-left toast is at its own offset 0, independent of the top-right group')
})

test('bottom-anchored stacks offset in the negative direction', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="br1" position="bottom-right" timeout="0">First</substrate-toast>
        <substrate-toast id="br2" position="bottom-right" timeout="0">Second</substrate-toast>
    `
    await waitFor('#br1')
    const br1 = document.getElementById('br1') as SubstrateToast
    const br2 = document.getElementById('br2') as SubstrateToast

    br1.toast()
    await sleep(50)
    br2.toast()
    await sleep(50)

    const offset = br2.style.getPropertyValue('--toast-offset')
    t.ok(offset.startsWith('-'),
        'Second toast in a bottom-anchored stack has a negative offset')
})

test('a top-center toast is anchored to the top edge', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast id="tc" position="top-center" timeout="0">Top center</substrate-toast>
    `
    await waitFor('#tc')
    const tc = document.getElementById('tc') as SubstrateToast
    tc.toast()
    await sleep(50)

    t.equal(getComputedStyle(tc).top, '16px',
        'top-center toast is anchored 1rem (16px) from the top edge')
})

// ============================================================================
// Accessibility Tests
// ============================================================================

test('should have correct ARIA attributes', async t => {
    clearToasts()
    document.body.innerHTML = `
        <substrate-toast open>
            Accessible message
        </substrate-toast>
    `

    const container = await waitFor('.toast')
    t.equal(container?.getAttribute('role'), 'status',
        'Should have role="status"')
    t.equal(container?.getAttribute('aria-live'), 'polite',
        'Should have aria-live="polite"')
    t.equal(container?.getAttribute('aria-atomic'), 'true',
        'Should have aria-atomic="true"')
})

// ============================================================================
// Cleanup
// ============================================================================

test('all done', () => {
    clearToasts()
    // @ts-expect-error test env
    window.testsFinished = true
})

// Helper to clear DOM between tests
function clearToasts () {
    document.querySelectorAll('substrate-toast').forEach(el => {
        (el as SubstrateToast).hide()
        el.remove()
    })
}
