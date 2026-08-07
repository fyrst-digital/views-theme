<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Rating — rating summary gates; Twig composes.
 */
#[AsTwigComponent]
class Rating
{
    public mixed $product = null;

    public int $totalReviews = 0;

    public bool $showReviews = true;

    public string $size = 'md';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public float $average = 0.0;

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
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $reviewsEnabled = (bool) $this->systemConfigService->get(
            'core.listing.showReview',
            $this->salesChannelContextAccessor->get()?->getSalesChannelId(),
        );

        $ratingAverage = $this->product->getRatingAverage();
        $this->average = $ratingAverage !== null ? (float) $ratingAverage : 0.0;

        $this->visible = $this->showReviews
            && $reviewsEnabled
            && $this->totalReviews > 0
            && $this->average > 0;
    }
}
