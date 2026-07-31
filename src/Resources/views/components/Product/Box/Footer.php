<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Box;

use Fyrst\ViewsTheme\Service\ProductDetailUrlBuilder;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Box:Footer — detail href + tax-note default + variation gate; Twig only composes.
 */
#[AsTwigComponent]
class Footer
{
    public mixed $product = null;

    public ?string $href = null;

    public bool $showPrice = true;

    public bool $showActions = true;

    public bool $showVariations = true;

    public bool $priceShowPrice = true;

    public mixed $priceShowTaxNote = null;

    public bool $showQuantity = false;

    public ?string $referrerCategoryId = null;

    public ?string $searchTerm = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showVariationsBlock = false;

    /**
     * @var list<array<string, mixed>>
     */
    public array $variations = [];

    public function __construct(
        private readonly ProductDetailUrlBuilder $productDetailUrlBuilder,
        private readonly SystemConfigService $systemConfigService,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContext()?->getSalesChannelId();
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

        $variantConfig = $this->product->getVariantListingConfig();
        $displayParent = $variantConfig !== null
            && $variantConfig->getDisplayParent()
            && $this->product->getParentId() === null;

        $this->variations = $this->product->getVariation();
        $this->showVariationsBlock = !$displayParent
            && $this->variations !== []
            && $this->showVariations;
    }

    private function salesChannelContext(): ?SalesChannelContext
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);

        return $context instanceof SalesChannelContext ? $context : null;
    }
}
