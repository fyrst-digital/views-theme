<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Shopware\Core\Content\Product\Aggregate\ProductReview\ProductReviewEntity;
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

    /**
     * Prefill / resubmit values for Review:Form (plain scalars only).
     *
     * @var array{points?: float|int, title?: string, content?: string, id?: ?string}|null
     */
    public ?array $formValues = null;

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

    public bool $hasCustomerReview = false;

    public bool $showForm = false;

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

        $this->hasCustomerReview = $this->reviews->getCustomerReview() !== null;

        if ($this->ratingSuccess === -1 || $this->ratingSuccess === '-1') {
            $this->mode = 'form';
        }

        $this->showForm = $this->mode === 'form';

        if ($this->formValues === null) {
            $this->formValues = $this->formValuesFromCustomerReview($this->reviews->getCustomerReview());
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

    /**
     * @return array{points: float, title: string, content: string, id: ?string}|null
     */
    private function formValuesFromCustomerReview(?ProductReviewEntity $review): ?array
    {
        if ($review === null) {
            return null;
        }

        return [
            'points' => (float) $review->getPoints(),
            'title' => (string) ($review->getTitle() ?? ''),
            'content' => (string) ($review->getContent() ?? ''),
            'id' => $review->getId(),
        ];
    }
}
