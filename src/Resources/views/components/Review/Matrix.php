<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Fyrst\ViewsTheme\Service\ReviewPointsNormalizer;
use Shopware\Core\Content\Product\SalesChannel\Review\MatrixElement;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Review:Matrix — points filter rows from reviews DTO + URL SoT.
 */
#[AsTwigComponent]
class Matrix
{
    public mixed $reviews = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    /**
     * @var list<array{points: int, count: int, percent: float, checked: bool, disabled: bool, inputId: string}>
     */
    public array $rows = [];

    public function __construct(
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->reviews instanceof ProductReviewResult) {
            $this->visible = false;
            $this->rows = [];

            return;
        }

        $matrix = $this->reviews->getMatrix();
        if ($matrix->getTotalReviewCount() < 1) {
            $this->visible = false;
            $this->rows = [];

            return;
        }

        $selected = $this->selectedPoints();
        $selectedSet = array_fill_keys($selected, true);

        $rows = [];
        foreach ($matrix->getMatrix() as $element) {
            if (!$element instanceof MatrixElement) {
                continue;
            }

            $points = $element->getPoints();
            $count = $element->getCount();

            $rows[] = [
                'points' => $points,
                'count' => $count,
                'percent' => $element->getPercent(),
                'checked' => isset($selectedSet[(string) $points]),
                'disabled' => $count < 1,
                'inputId' => 'vi-review-matrix-' . $points . '-' . bin2hex(random_bytes(4)),
            ];
        }

        $this->rows = $rows;
        $this->visible = $rows !== [];
    }

    /**
     * @return list<string>
     */
    private function selectedPoints(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return [];
        }

        // Query bag only — POST body `points` is the save form scalar.
        $raw = $request->query->all()['points'] ?? null;

        return ReviewPointsNormalizer::toList($raw);
    }
}
