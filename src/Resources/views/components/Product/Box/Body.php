<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Box;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Box:Body — variation gate + description visibility; Twig only composes.
 */
#[AsTwigComponent]
class Body
{
    public mixed $product = null;

    public bool $showDescription = true;

    public bool $showVariations = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showVariationsBlock = false;

    public bool $visible = false;

    /**
     * @var list<array<string, mixed>>
     */
    public array $variations = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            $this->visible = $this->showDescription;

            return;
        }

        $variantConfig = $this->product->getVariantListingConfig();
        $displayParent = $variantConfig !== null
            && $variantConfig->getDisplayParent()
            && $this->product->getParentId() === null;

        $this->variations = $this->product->getVariation();
        $this->showVariationsBlock = !$displayParent
            && $this->variations !== []
            && $this->showVariations;

        $this->visible = $this->showVariationsBlock || $this->showDescription;
    }
}
