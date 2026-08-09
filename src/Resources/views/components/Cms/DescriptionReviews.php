<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Cms;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Cms:DescriptionReviews — CMS element shell; composes Tabs + panes.
 */
#[AsTwigComponent]
class DescriptionReviews
{
    public mixed $product = null;

    public mixed $reviews = null;

    public mixed $ratingSuccess = null;

    public ?bool $showReview = null;

    public ?string $productId = null;

    public ?string $parentId = null;

    public ?string $listUrl = null;

    public ?string $saveUrl = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $reviewsActive = false;

    public string $descriptionTabId = 'description-tab';

    public string $descriptionPaneId = 'description-tab-pane';

    public string $reviewTabId = 'review-tab';

    public string $reviewPaneId = 'review-tab-pane';

    public string $activeTabId = 'description-tab';

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->product instanceof SalesChannelProductEntity) {
            $this->productId = $this->productId ?: $this->product->getId();
            $this->parentId = $this->parentId ?: $this->product->getParentId();
        }

        if ($this->reviews instanceof ProductReviewResult) {
            $this->productId = $this->productId ?: $this->reviews->getProductId();
            $this->parentId = $this->parentId ?: $this->reviews->getParentId();
        }

        if ($this->showReview === null) {
            $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
            $this->showReview = (bool) $this->systemConfigService->get(
                'core.listing.showReview',
                $salesChannelId,
            );
        }

        $this->reviewsActive = $this->showReview && $this->isReviewsActive($this->ratingSuccess);

        if ($this->productId) {
            $this->descriptionTabId = 'description-tab-' . $this->productId;
            $this->descriptionPaneId = 'description-tab-' . $this->productId . '-pane';
            $this->reviewTabId = 'review-tab-' . $this->productId;
            $this->reviewPaneId = 'review-tab-' . $this->productId . '-pane';

            if ($this->listUrl === null) {
                $this->listUrl = $this->urlGenerator->generate(
                    'frontend.views-theme.review.list',
                    ['productId' => $this->productId],
                );
            }

            if ($this->saveUrl === null) {
                $this->saveUrl = $this->urlGenerator->generate(
                    'frontend.views-theme.review.save',
                    ['productId' => $this->productId],
                );
            }
        }

        $this->activeTabId = $this->reviewsActive ? $this->reviewTabId : $this->descriptionTabId;
    }

    private function isReviewsActive(mixed $ratingSuccess): bool
    {
        if ($ratingSuccess === true) {
            return true;
        }

        if ($ratingSuccess === false || $ratingSuccess === null || $ratingSuccess === '') {
            return false;
        }

        return \in_array($ratingSuccess, [1, 2, -1, '1', '2', '-1'], true);
    }
}
