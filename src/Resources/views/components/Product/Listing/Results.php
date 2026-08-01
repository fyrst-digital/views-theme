<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Listing;

use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Listing:Results — XHR-swappable island (actions, items, pagination).
 */
#[AsTwigComponent]
class Results
{
    public mixed $searchResult = null;

    public string $boxLayout = 'default';

    public string $listingColumns = 'col-sm-6 col-lg-4 col-xl-3';

    public ?string $referrerCategoryId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $hasResults = false;

    public bool $showBottomPagination = false;

    public string $paginationSearchQuery = '';

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->boxLayout === '' || $this->boxLayout === 'standard') {
            $this->boxLayout = 'default';
        }

        if (!$this->searchResult instanceof EntitySearchResult) {
            return;
        }

        $total = $this->searchResult->getTotal();
        $limit = $this->searchResult->getLimit() ?? 0;

        $this->hasResults = $total > 0;
        $this->showBottomPagination = $limit > 0 && $total > $limit;

        if ($this->searchResult instanceof ProductListingResult) {
            $search = $this->searchResult->getCurrentFilter('search');
            if (\is_string($search) && $search !== '') {
                $this->paginationSearchQuery = '&search=' . rawurlencode($search);
            }
        }
    }
}
