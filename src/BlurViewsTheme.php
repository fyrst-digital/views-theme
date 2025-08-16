<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme;

use Fyrst\ShogunBundle\ShogunBundle;
use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Framework\ThemeInterface;
use Shopware\Core\Framework\Parameter\AdditionalBundleParameters;

class BlurViewsTheme extends Plugin implements ThemeInterface
{

    public function getAdditionalBundles(AdditionalBundleParameters $parameters): array
    {
        return [
            new ShogunBundle(),
        ];
    }

    public function executeComposerCommands(): bool
    {
        return true;
    }
}
