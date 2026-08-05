<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\ProductPriceData;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;

/**
 * Shared product price view-model math for Product:Price / Product:Badges.
 */
final class ProductPriceResolver
{
    public function resolve(SalesChannelProductEntity $product): ProductPriceData
    {
        $prices = $product->getCalculatedPrices();
        $base = $product->getCalculatedPrice();
        $hasRange = $prices->count() > 1;

        $variantConfig = $product->getVariantListingConfig();
        $displayParent = $variantConfig !== null
            && $variantConfig->getDisplayParent()
            && $product->getParentId() === null;

        $displayFromVariants = false;
        if ($displayParent) {
            $displayFromVariants = $base->getUnitPrice() !== $product->getCalculatedCheapestPrice()->getUnitPrice();
        }

        $display = $base;
        if ($displayParent) {
            $display = $product->getCalculatedCheapestPrice();
        }

        if ($prices->count() > 0) {
            $last = $prices->last();
            if ($last instanceof CalculatedPrice) {
                $display = $last;
            }
        }

        $listPriceSource = $prices->count() > 0 ? $prices->last() : $base;
        if (!$listPriceSource instanceof CalculatedPrice) {
            $listPriceSource = $base;
        }

        $displayListPrice = $display->getListPrice();
        $hasListPrice = $displayListPrice !== null && $displayListPrice->getPercentage() > 0;

        $sourceListPrice = $listPriceSource->getListPrice();
        $sourceHasListPrice = $sourceListPrice !== null && $sourceListPrice->getPercentage() > 0;
        $showDiscountBadge = $sourceHasListPrice && !$hasRange && !$displayFromVariants;

        return new ProductPriceData(
            price: $display,
            prices: $prices,
            displayFromVariants: $displayFromVariants,
            hasListPrice: $hasListPrice,
            showFromPrefix: $hasRange || $displayFromVariants,
            hasReferencePrice: $display->getReferencePrice() !== null,
            hasRegulationPrice: $display->getRegulationPrice()?->getPrice() !== null,
            showDiscountBadge: $showDiscountBadge,
            discountPercent: $showDiscountBadge ? $sourceListPrice->getPercentage() : null,
        );
    }
}
