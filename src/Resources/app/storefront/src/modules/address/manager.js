/**
 * The mounted Address:Manager (single shared shell). Back / Create / Edit / Default
 * call it by method name; nothing happens while no manager is mounted.
 *
 * @module @views-theme/modules/address/manager
 */
import { createService } from '@views-theme/modules/shared/service.js'

export const manager = createService()
