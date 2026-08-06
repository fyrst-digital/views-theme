<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Prices — tiered / unit / tax stack gates; Twig composes children.
 */
#[AsTwigComponent]
class Prices
{
    public mixed $product = null;

    public bool $showPrice = true;

    public bool $showTieredPrices = true;

    public bool $showTaxNote = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showTieredBlock = false;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $calculatedPrices = $this->product->getCalculatedPrices();
        $this->showTieredBlock = $this->showTieredPrices
            && $calculatedPrices !== null
            && $calculatedPrices->count() > 1;
    }
}
