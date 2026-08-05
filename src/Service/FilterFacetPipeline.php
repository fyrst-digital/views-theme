<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Catalog facet resolve + optional reduced-aggregation availability (SSR + batch SoT).
 */
final class FilterFacetPipeline
{
    public function __construct(
        private readonly FilterFacetResolver $facetResolver,
        private readonly FilterAggregationLoader $aggregationLoader,
        private readonly FilterAvailabilityApplier $availabilityApplier,
        private readonly FilterRequestSelection $requestSelection,
    ) {
    }

    /**
     * @return list<FilterFacet>
     */
    public function resolveCatalog(?EntitySearchResult $listing): array
    {
        return $this->facetResolver->resolve($listing);
    }

    /**
     * @param list<FilterFacet> $facets
     *
     * @return list<FilterFacet>
     */
    public function applyAvailabilityIfNeeded(
        array $facets,
        Request $request,
        SalesChannelContext $context,
        ?EntitySearchResult $listing,
        bool $disableEmptyFilter,
    ): array {
        if (!$disableEmptyFilter || $facets === []) {
            return $facets;
        }

        if (!$this->requestSelection->requestHasFilterParams($request)) {
            return $facets;
        }

        $reduced = $this->aggregationLoader->loadReduced($request, $context, $listing);
        if ($reduced === null) {
            return $facets;
        }

        $selected = $this->requestSelection->selectedFromRequest($request);

        return $this->availabilityApplier->apply($facets, $reduced, $selected);
    }

    /**
     * @return list<FilterFacet>
     */
    public function resolveWithAvailability(
        ?EntitySearchResult $listing,
        Request $request,
        SalesChannelContext $context,
        bool $disableEmptyFilter,
    ): array {
        $facets = $this->resolveCatalog($listing);

        return $this->applyAvailabilityIfNeeded(
            $facets,
            $request,
            $context,
            $listing,
            $disableEmptyFilter,
        );
    }
}
