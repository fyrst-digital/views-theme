<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Reviews — rating summary + review-tab link gates; Twig composes.
 */
#[AsTwigComponent]
class Reviews
{
    public mixed $product = null;

    public int $totalReviews = 0;

    public bool $showReviews = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public float $average = 0.0;

    /**
     * @var array{selector: string, scrollToElement: bool, excludedViewports: list<string>}
     */
    public array $remoteClickOptions = [
        'selector' => '',
        'scrollToElement' => true,
        'excludedViewports' => ['XS'],
    ];

    public string $reviewTabHref = '';

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

        if (!$this->visible) {
            return;
        }

        $productId = $this->product->getId();
        $this->remoteClickOptions = [
            'selector' => '#review-tab-' . $productId,
            'scrollToElement' => true,
            'excludedViewports' => ['XS'],
        ];
        $this->reviewTabHref = '#review-tab-' . $productId . '-pane';
    }
}
