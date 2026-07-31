<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Action;

use Fyrst\ViewsTheme\Service\ProductDetailUrlBuilder;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Action:Detail — listing-aware href; Twig only composes root-host Button.
 */
#[AsTwigComponent]
class Detail
{
    public mixed $product = null;

    public ?string $href = null;

    public ?string $referrerCategoryId = null;

    public ?string $searchTerm = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public function __construct(
        private readonly ProductDetailUrlBuilder $productDetailUrlBuilder,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->product instanceof SalesChannelProductEntity) {
            $this->href ??= $this->productDetailUrlBuilder->forProduct(
                $this->product,
                $this->referrerCategoryId,
                $this->searchTerm,
            );
        }

        $this->visible = $this->href !== null && $this->href !== '';
    }
}
