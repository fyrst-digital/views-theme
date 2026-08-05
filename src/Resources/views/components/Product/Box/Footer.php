<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Box;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Service\ProductDetailUrlBuilder;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Box:Footer — detail href + tax-note default; Twig only composes.
 */
#[AsTwigComponent]
class Footer
{
    public mixed $product = null;

    public ?string $href = null;

    public bool $showPrice = true;

    public bool $showActions = true;

    public bool $priceShowPrice = true;

    public mixed $priceShowTaxNote = null;

    public bool $showQuantity = false;

    public ?string $referrerCategoryId = null;

    public ?string $searchTerm = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly ProductDetailUrlBuilder $productDetailUrlBuilder,
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $this->priceShowTaxNote ??= (bool) $this->systemConfigService->get(
            'core.listing.allowBuyInListing',
            $salesChannelId,
        );

        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $this->href ??= $this->productDetailUrlBuilder->forProduct(
            $this->product,
            $this->referrerCategoryId,
            $this->searchTerm,
        );
    }

}
