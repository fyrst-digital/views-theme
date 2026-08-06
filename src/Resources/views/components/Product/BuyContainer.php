<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:BuyContainer — PDP / CMS buy-box shell gates; Twig composes children.
 */
#[AsTwigComponent]
class BuyContainer
{
    public mixed $product = null;

    public mixed $configuratorSettings = null;

    public int $totalReviews = 0;

    public ?string $elementId = null;

    public ?string $pageType = null;

    public mixed $variantsGrid = null;

    public bool $showHeader = true;

    public bool $showPrice = true;

    public bool $showTieredPrices = true;

    public bool $showTaxNote = true;

    public bool $showBuyForm = true;

    public bool $showActions = true;

    public bool $showReviews = true;

    public bool $showOrderNumber = true;

    public bool $showDelivery = true;

    public bool $showConfigurator = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $productActive = false;

    public bool $useVariantsGrid = false;

    public bool $showBuyFormBlock = false;

    public bool $showConfiguratorBlock = false;

    public bool $showOrderNumberBlock = false;

    public string $rootElementClass = 'product-detail-buy';

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly SystemConfigService $systemConfigService,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();

        $variantsGridActive = (bool) $this->systemConfigService->get(
            'ViewsTheme.config.variantsGridActive',
            $salesChannelId,
        );

        $this->rootElementClass = 'product-detail-buy';
        if ($this->elementId !== null && $this->elementId !== '') {
            $this->rootElementClass .= '-' . $this->elementId;
        }

        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $this->productActive = (bool) $this->product->getActive();

        $variantCount = 0;
        if ($this->variantsGrid instanceof ArrayStruct) {
            $variants = $this->variantsGrid->get('variants');
            if (\is_countable($variants)) {
                $variantCount = \count($variants);
            }
        }

        $this->useVariantsGrid = $variantsGridActive && $variantCount > 0;

        $this->showBuyFormBlock = $this->productActive
            && $this->showBuyForm
            && !$this->useVariantsGrid;

        $this->showConfiguratorBlock = $this->showConfigurator
            && !$this->useVariantsGrid
            && $this->product->getParentId() !== null
            && \is_countable($this->configuratorSettings)
            && \count($this->configuratorSettings) > 0;

        $productNumber = $this->product->getProductNumber();
        $this->showOrderNumberBlock = $this->showOrderNumber
            && \is_string($productNumber)
            && $productNumber !== '';
    }
}
