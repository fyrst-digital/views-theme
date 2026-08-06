<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Actions — secondary product actions (wishlist, …); Twig composes.
 */
#[AsTwigComponent]
class Actions
{
    public mixed $product = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $wishlistEnabled = false;

    public ?string $productId = null;

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
        if ($this->product instanceof SalesChannelProductEntity) {
            $this->productId = $this->product->getId();
        }

        if ($this->productId === null || $this->productId === '') {
            return;
        }

        $this->wishlistEnabled = (bool) $this->systemConfigService->get(
            'core.cart.wishlistEnabled',
            $this->salesChannelContextAccessor->get()?->getSalesChannelId(),
        );
    }
}
