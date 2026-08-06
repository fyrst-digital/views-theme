<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Filter;

use Fyrst\ViewsTheme\Service\FilterFacetPipeline;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Filter:Panel — catalog facets + SSR availability when disableEmptyFilter.
 */
#[AsTwigComponent]
class Panel
{
    public ?EntitySearchResult $listing = null;

    public bool $ariaLiveUpdates = true;

    public bool $showHeader = false;

    /**
     * Whether to render the active-filter chip row (`Filter:Active`).
     */
    public bool $showActive = true;

    /**
     * Layout chrome: horizontal chip bar (`bar`) or vertical accordion stack (`stacked`).
     */
    public string $layout = 'bar';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<FilterFacet>
     */
    public array $facets = [];

    public mixed $disableEmptyFilter = null;

    public function __construct(
        private readonly FilterFacetPipeline $facetPipeline,
        private readonly SystemConfigService $systemConfigService,
        private readonly RequestStack $requestStack,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->disableEmptyFilter === null) {
            $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
            $this->disableEmptyFilter = (bool) $this->systemConfigService->get(
                'core.listing.disableEmptyFilterOptions',
                $salesChannelId,
            );
        } else {
            $this->disableEmptyFilter = (bool) $this->disableEmptyFilter;
        }

        $request = $this->requestStack->getCurrentRequest();
        $context = $this->salesChannelContextAccessor->get();
        if ($request === null || $context === null) {
            $this->facets = $this->facetPipeline->resolveCatalog($this->listing);

            return;
        }

        $this->facets = $this->facetPipeline->resolveWithAvailability(
            $this->listing,
            $request,
            $context,
            (bool) $this->disableEmptyFilter,
        );
    }
}
