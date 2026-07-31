<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\ProductPriceResolver;
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

        $this->showTopseller = (bool) $this->product->getMarkAsTopseller();
        $this->showNew = $this->product->isNew();

        $data = $this->productPriceResolver->resolve($this->product);
        $this->showDiscount = $data->showDiscountBadge;
        $this->discountPercent = $data->discountPercent;

        $this->visible = $this->showDiscount || $this->showTopseller || $this->showNew;
    }
}
