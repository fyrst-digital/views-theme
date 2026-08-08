<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Review:Form — login gate + field prefill; Twig composes.
 */
#[AsTwigComponent]
class Form
{
    public mixed $reviews = null;

    /**
     * @var array{points?: float|int, title?: string, content?: string, id?: ?string}|null
     */
    public ?array $formValues = null;

    public mixed $formViolations = null;

    public ?string $productId = null;

    public ?string $parentId = null;

    public ?string $saveUrl = null;

    /** When true, form region is not shown (list mode). */
    public bool $hidden = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $isLoggedIn = false;

    public int $maxPoints = 5;

    public float|int $currentPoints = 5;

    public ?string $titleValue = null;

    public ?string $contentValue = null;

    public ?string $reviewId = null;

    public string $formId = '';

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
        $customer = $this->salesChannelContextAccessor->get()?->getCustomer();
        $this->isLoggedIn = $customer !== null && !$customer->getGuest();

        $maxPoints = 5;
        if ($this->reviews instanceof ProductReviewResult) {
            $maxPoints = (int) $this->reviews->getMatrix()->getMaxPoints();
            if ($maxPoints < 1) {
                $maxPoints = 5;
            }
        }
        $this->maxPoints = $maxPoints;

        $points = $this->formValues['points'] ?? null;
        $this->currentPoints = $points !== null ? $points : $maxPoints;

        $this->titleValue = isset($this->formValues['title']) ? (string) $this->formValues['title'] : null;
        $this->contentValue = isset($this->formValues['content']) ? (string) $this->formValues['content'] : null;

        $reviewId = $this->formValues['id'] ?? null;
        if ($reviewId === null && $this->reviews instanceof ProductReviewResult) {
            $customerReview = $this->reviews->getCustomerReview();
            $reviewId = $customerReview?->getId();
        }
        $this->reviewId = $reviewId !== null && $reviewId !== '' ? (string) $reviewId : null;

        $this->formId = 'vi-review-form-' . bin2hex(random_bytes(4));
    }
}
