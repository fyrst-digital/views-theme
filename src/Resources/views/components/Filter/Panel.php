<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Filter;

use Fyrst\ViewsTheme\Service\FilterAggregationLoader;
use Fyrst\ViewsTheme\Service\FilterAvailabilityApplier;
use Fyrst\ViewsTheme\Service\FilterFacetResolver;
use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
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
        private readonly FilterFacetResolver $filterFacetResolver,
        private readonly FilterAggregationLoader $aggregationLoader,
        private readonly FilterAvailabilityApplier $availabilityApplier,
        private readonly SystemConfigService $systemConfigService,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->facets = $this->filterFacetResolver->resolve($this->listing);

        if ($this->disableEmptyFilter === null) {
            $salesChannelId = $this->salesChannelContext()?->getSalesChannelId();
            $this->disableEmptyFilter = (bool) $this->systemConfigService->get(
                'core.listing.disableEmptyFilterOptions',
                $salesChannelId,
            );
        } else {
            $this->disableEmptyFilter = (bool) $this->disableEmptyFilter;
        }

        if (!$this->disableEmptyFilter) {
            return;
        }

        $request = $this->requestStack->getCurrentRequest();
        $context = $this->salesChannelContext();
        if ($request === null || $context === null) {
            return;
        }

        if (!$this->availabilityApplier->requestHasFilterParams($request)) {
            return;
        }

        $reduced = $this->aggregationLoader->loadReduced($request, $context, $this->listing);
        if ($reduced === null) {
            return;
        }

        $selected = $this->availabilityApplier->selectedFromRequest($request);
        $this->facets = $this->availabilityApplier->apply($this->facets, $reduced, $selected);
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
}
