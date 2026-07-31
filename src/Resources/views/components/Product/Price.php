<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\ProductPriceResolver;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Price — resolve display price / from-prefix / list-price gates; Twig only composes.
 * Tier table / tax note are parent-mounted siblings (Product:Price:Tiered / Product:Price:Tax).
 */
#[AsTwigComponent]
class Price
{
    public mixed $product = null;

    public bool $showPrice = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public ?CalculatedPrice $price = null;

    public bool $hasListPrice = false;

    public bool $displayFromVariants = false;

    public bool $showFromPrefix = false;

    public bool $hasReferencePrice = false;

    public bool $hasRegulationPrice = false;

    public function __construct(
        private readonly ProductPriceResolver $productPriceResolver,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $data = $this->productPriceResolver->resolve($this->product);

        $this->price = $data->price;
        $this->hasListPrice = $data->hasListPrice;
        $this->displayFromVariants = $data->displayFromVariants;
        $this->showFromPrefix = $data->showFromPrefix;
        $this->hasReferencePrice = $data->hasReferencePrice;
        $this->hasRegulationPrice = $data->hasRegulationPrice;
    }
}
