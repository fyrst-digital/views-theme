<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Badges — discount / topseller / new gates live here; Twig only composes.
 */
#[AsTwigComponent]
class Badges
{
    public mixed $product = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public bool $showDiscount = false;

    public bool $showTopseller = false;

    public bool $showNew = false;

    public ?float $discountPercent = null;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $this->showTopseller = (bool) $this->product->getMarkAsTopseller();
        $this->showNew = $this->product->isNew();
        $this->resolveDiscount($this->product);
        $this->visible = $this->showDiscount || $this->showTopseller || $this->showNew;
    }

    private function resolveDiscount(SalesChannelProductEntity $product): void
    {
        $prices = $product->getCalculatedPrices();
        $price = $prices->count() > 0 ? $prices->last() : $product->getCalculatedPrice();

        if (!$price instanceof CalculatedPrice) {
            return;
        }

        $listPrice = $price->getListPrice();
        $hasListPrice = $listPrice !== null && $listPrice->getPercentage() > 0;
        $hasRange = $prices->count() > 1;

        $variantConfig = $product->getVariantListingConfig();
        $displayParent = $variantConfig !== null
            && $variantConfig->getDisplayParent()
            && $product->getParentId() === null;

        $displayFromVariants = false;
        if ($displayParent) {
            $displayFromVariants = $price->getUnitPrice() !== $product->getCalculatedCheapestPrice()->getUnitPrice();
        }

        if (!$hasListPrice || $hasRange || $displayFromVariants) {
            return;
        }

        $this->showDiscount = true;
        $this->discountPercent = $listPrice->getPercentage();
    }
}
