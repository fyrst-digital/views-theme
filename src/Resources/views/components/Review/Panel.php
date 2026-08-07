<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Review:Panel — reviews DTO + owner URLs; Twig composes.
 */
#[AsTwigComponent]
class Panel
{
    public mixed $reviews = null;

    public ?string $productId = null;

    public ?string $parentId = null;

    public mixed $ratingSuccess = null;

    public mixed $formViolations = null;

    public mixed $formData = null;

    /** list | form */
    public string $mode = 'list';

    public ?string $listUrl = null;

    public ?string $saveUrl = null;

    public bool $history = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var array<string, mixed>
     */
    public array $componentOptions = [];

    public int $productReviewCount = 0;

    public int $totalReviewCount = 0;

    public float $productAvgRating = 0.0;

    public bool $isLoggedIn = false;

    public bool $hasCustomerReview = false;

    public bool $showForm = false;

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->reviews instanceof ProductReviewResult) {
            return;
        }

        $this->productId = $this->productId ?: $this->reviews->getProductId();
        $this->parentId = $this->parentId ?: $this->reviews->getParentId();

        $this->productReviewCount = $this->reviews->getTotal();
        $this->totalReviewCount = $this->reviews->getMatrix()->getTotalReviewCount();
        $avg = $this->reviews->getMatrix()->getAverageRating();
        $this->productAvgRating = $this->totalReviewCount > 0 ? round($avg, 2) : 0.0;

        $customer = $this->salesChannelContextAccessor->get()?->getCustomer();
        $this->isLoggedIn = $customer !== null && !$customer->getGuest();
        $this->hasCustomerReview = $this->reviews->getCustomerReview() !== null;

        if ($this->ratingSuccess === -1 || $this->ratingSuccess === '-1') {
            $this->mode = 'form';
        }

        $this->showForm = $this->mode === 'form';

        if ($this->formData === null && $this->reviews->getCustomerReview() !== null) {
            $this->formData = $this->reviews->getCustomerReview();
        }

        $this->componentOptions = [
            'listUrl' => $this->listUrl,
            'saveUrl' => $this->saveUrl,
            'baseParams' => array_filter([
                'parentId' => $this->parentId,
            ], static fn ($v) => $v !== null && $v !== ''),
            'history' => $this->history,
            'listComponent' => 'ViewsTheme:Review:Results',
            'controlComponents' => [
                'ViewsTheme:Pagination',
                'ViewsTheme:Review:Sort',
                'ViewsTheme:Review:Language',
                'ViewsTheme:Review:Matrix',
            ],
            'loadingEvent' => 'ViewsTheme:Review:Loading',
            'changedEvent' => 'ViewsTheme:Review:Changed',
        ];
    }
}
