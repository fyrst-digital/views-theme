<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Box;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Box:Actions — listing buy/detail gate; Twig only composes.
 */
#[AsTwigComponent]
class Actions
{
    public mixed $product = null;

    public ?string $href = null;

    public bool $showQuantity = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $displayBuyButton = false;

    public function __construct(
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
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $isAvailable = !$this->product->getIsCloseout()
            || $this->product->getStock() >= $this->product->getMinPurchase();
        $displayFrom = $this->product->getCalculatedPrices()->count() > 1;
        $allowBuy = (bool) $this->systemConfigService->get(
            'core.listing.allowBuyInListing',
            $this->salesChannelContextAccessor->get()?->getSalesChannelId(),
        );

        $this->displayBuyButton = $isAvailable
            && !$displayFrom
            && ($this->product->getChildCount() ?? 0) <= 0
            && $allowBuy;
    }

}
