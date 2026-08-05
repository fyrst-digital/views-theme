<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Price\Struct\PriceCollection;

/**
 * Resolved product price fields for UX view-models (Price, Badges, …).
 */
final readonly class ProductPriceData
{
    public function __construct(
        public CalculatedPrice $price,
        public PriceCollection $prices,
        public bool $displayFromVariants,
        public bool $hasListPrice,
        public bool $showFromPrefix,
        public bool $hasReferencePrice,
        public bool $hasRegulationPrice,
        public bool $showDiscountBadge,
        public ?float $discountPercent,
    ) {
    }
}
