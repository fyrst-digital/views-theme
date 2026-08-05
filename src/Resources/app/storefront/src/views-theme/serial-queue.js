/**
 * Serial async queue with optional per-key coalesce (last write wins per key).
 *
 * @param {{ coalesceKey?: (job: unknown) => string|null|undefined }} [options]
 */
export function createSerialQueue(options = {}) {
    let busy = false
    /** @type {unknown|null} */
    let single = null
    /** @type {Map<string, unknown>} */
    const byKey = new Map()
    /** @type {unknown[]} */
    const fifo = []

    /**
     * @param {unknown} job
     * @param {(job: unknown) => Promise<void>} run
     */
    async function enqueue(job, run) {
        const keyFn = options.coalesceKey
        const key = typeof keyFn === 'function' ? keyFn(job) : null

        if (key != null && key !== '') {
            byKey.set(String(key), job)
        } else if (keyFn) {
            fifo.push(job)
        } else {
            single = job
        }

        if (!busy) {
            await drain(run)
        }
    }

    /**
     * @param {(job: unknown) => Promise<void>} run
     */
    async function drain(run) {
        if (busy) {
            return
        }

        busy = true
        try {
            while (single != null || byKey.size > 0 || fifo.length > 0) {
                let job = null

                if (single != null) {
                    job = single
                    single = null
                } else if (fifo.length > 0) {
                    job = fifo.shift()
                } else {
                    const first = byKey.entries().next().value
                    if (!first) {
                        break
                    }
                    byKey.delete(first[0])
                    job = first[1]
                }

                if (job != null) {
                    await run(job)
                }
            }
        } finally {
            busy = false
        }
    }

    function clear() {
        single = null
        byKey.clear()
        fifo.length = 0
    }

    return {
        enqueue,
        clear,
        get busy() {
            return busy
        },
    }
}
