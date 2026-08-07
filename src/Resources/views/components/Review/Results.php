<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Review;

use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Shopware\Core\Framework\Adapter\Request\RequestParamHelper;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Review:Results island — counts, sort, language filter state.
 */
#[AsTwigComponent]
class Results
{
    public mixed $reviews = null;

    public ?string $productId = null;

    public ?string $parentId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public int $productReviewCount = 0;

    public int $reviewsPerPage = 10;

    public int $currentListPage = 1;

    public string $sortField = 'createdAt';

    public bool $languageFilterActive = false;

    public bool $languageFilterDisabled = false;

    /**
     * @var list<array{value: string, label: string}>
     */
    public array $sortOptions = [];

    /**
     * Owner component name for Pagination items.
     */
    public string $ownerComponent = 'ViewsTheme:Review:Panel';

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly SystemConfigService $systemConfigService,
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
        $this->currentListPage = max(1, (int) $this->reviews->getPage());

        $request = $this->requestStack->getCurrentRequest();

        $limit = $this->systemConfigService->getInt('core.listing.reviewsPerPage');
        $this->reviewsPerPage = $limit > 0 ? $limit : 10;

        $this->sortField = 'createdAt';
        $sorting = $this->reviews->getCriteria()->getSorting();
        if ($sorting !== [] && $sorting[0]->getField() === 'points') {
            $this->sortField = 'points';
        }

        $language = $request ? RequestParamHelper::get($request, 'language') : null;
        $this->languageFilterActive = $language === 'filter-language';

        $totalInLang = $this->reviews->getTotalReviewsInCurrentLanguage();
        $foreignCount = $this->productReviewCount - $totalInLang;
        $this->languageFilterDisabled = $foreignCount === 0 && !$this->languageFilterActive;

        $this->sortOptions = [
            [
                'value' => 'createdAt',
                'label' => 'detail.reviewSortNewLabel',
            ],
            [
                'value' => 'points',
                'label' => 'detail.reviewSortTopRatedLabel',
            ],
        ];
    }
}
