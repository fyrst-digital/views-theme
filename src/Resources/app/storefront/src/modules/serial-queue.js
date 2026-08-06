/**
 * Serial async queue with optional per-key coalesce (last write wins per key).
 *
 * @module @views-theme/modules/serial-queue
 * @template TJob
 */

/**
 * @template TJob
 * @typedef {object} SerialQueue
 * @property {(job: TJob, run: (job: TJob) => Promise<void>) => Promise<void>} enqueue
 * @property {() => void} clear
 * @property {boolean} busy
 */

/**
 * @template TJob
 * @param {import('@views-theme/modules/types.js').SerialQueueOptions<TJob>} [options]
 * @returns {SerialQueue<TJob>}
 */
export function createSerialQueue(options = {}) {
    let busy = false
    /** @type {TJob|null} */
    let single = null
    /** @type {Map<string, TJob>} */
    const byKey = new Map()
    /** @type {TJob[]} */
    const fifo = []

    /**
     * @param {TJob} job
     * @param {(job: TJob) => Promise<void>} run
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
     * @param {(job: TJob) => Promise<void>} run
     */
    async function drain(run) {
        if (busy) {
            return
        }

        busy = true
        try {
            while (single != null || byKey.size > 0 || fifo.length > 0) {
                /** @type {TJob|null} */
                let job = null

                if (single != null) {
                    job = single
                    single = null
                } else if (fifo.length > 0) {
                    job = /** @type {TJob} */ (fifo.shift())
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
