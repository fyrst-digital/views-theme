<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Shopware\Core\Content\Product\ProductCollection;

/**
 * One Cms:CrossSelling tab: cross-selling id + label, its products, and the tab / panel ids.
 */
final readonly class CrossSellingTab
{
    public function __construct(
        public string $id,
        public string $name,
        public ProductCollection $products,
        public string $tabId,
        public string $panelId,
    ) {
    }
}
