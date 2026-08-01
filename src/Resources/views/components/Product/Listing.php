<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Listing — listing plugin config gates + layout normalize; Twig composes.
 */
#[AsTwigComponent]
class Listing
{
    public mixed $searchResult = null;

    public ?string $dataUrl = null;

    public ?string $filterUrl = null;

    /**
     * @var array<string, mixed>
     */
    public array $params = [];

    public mixed $sidebar = false;

    public string $boxLayout = 'default';

    public string $listingColumns = 'col-sm-6 col-lg-4 col-xl-3';

    public bool $ariaLiveUpdates = true;

    public mixed $disableEmptyFilter = null;

    public ?string $referrerCategoryId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $hasResults = false;

    public bool $showBottomPagination = false;

    public int $paginationPage = 1;

    public string $paginationSearchQuery = '';

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
        if ($this->boxLayout === '' || $this->boxLayout === 'standard') {
            $this->boxLayout = 'default';
        }

        $salesChannelId = $this->salesChannelContext()?->getSalesChannelId();

        if ($this->disableEmptyFilter === null) {
            $this->disableEmptyFilter = (bool) $this->systemConfigService->get(
                'core.listing.disableEmptyFilterOptions',
                $salesChannelId,
            );
        } else {
            $this->disableEmptyFilter = (bool) $this->disableEmptyFilter;
        }

        if ($this->referrerCategoryId === null
            && (bool) $this->systemConfigService->get(
                'core.listing.buildBreadcrumbByReferrerCategory',
                $salesChannelId,
            )
        ) {
            $navigationId = $this->navigationId();
            if ($navigationId !== null && $navigationId !== '') {
                $this->referrerCategoryId = $navigationId;
            }
        }

        if (!$this->searchResult instanceof EntitySearchResult) {
            return;
        }

        $total = $this->searchResult->getTotal();
        $limit = $this->searchResult->getLimit() ?? 0;

        $this->hasResults = $total > 0;
        $this->showBottomPagination = $limit > 0 && $total > $limit;
        $this->paginationPage = $this->searchResult->getPage();

        if ($this->searchResult instanceof ProductListingResult) {
            $search = $this->searchResult->getCurrentFilter('search');
            if (\is_string($search) && $search !== '') {
                $this->paginationSearchQuery = '&search=' . rawurlencode($search);
            }
        }
    }

    private function salesChannelContext(): ?SalesChannelContext
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);

        return $context instanceof SalesChannelContext ? $context : null;
    }

    private function navigationId(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $fromAttributes = $request->attributes->get('navigationId');
        if (\is_string($fromAttributes) && $fromAttributes !== '') {
            return $fromAttributes;
        }

        $fromQuery = $request->query->get('navigationId');
        if (\is_string($fromQuery) && $fromQuery !== '') {
            return $fromQuery;
        }

        return null;
    }
}
