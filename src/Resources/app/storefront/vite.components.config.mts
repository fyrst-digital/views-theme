import path from 'node:path'
import { createComponentBuildConfig } from '../../../../../../../vendor/shopware/storefront/Resources/app/storefront/build/vite/component-config-factory'

export default async () => {
    const storefrontAppDir = import.meta.dirname
    const modulesDir = path.resolve(storefrontAppDir, 'src/modules')

    return createComponentBuildConfig({
        componentRoot: path.resolve(storefrontAppDir, '../../views/components'),
        outDir: path.resolve(storefrontAppDir, '../../public/storefront/components'),
        namespace: 'ViewsTheme',
        storefrontAppDir,
        resolveAliases: {
            // Same specifier as npm file: dependency (dev server + IDE)
            '@views-theme/modules': modulesDir,
        },
    })
}
