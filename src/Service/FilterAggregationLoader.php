<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Loads reduced aggregations for filter availability (only-aggregations + reduce-aggregations).
 */
final class FilterAggregationLoader
{
    public function __construct(
        private readonly AbstractProductListingRoute $listingRoute,
        private readonly AbstractProductSearchRoute $searchRoute,
    ) {
    }

    public function loadReduced(
        Request $request,
        SalesChannelContext $context,
        ?EntitySearchResult $listing = null,
    ): ?AggregationResultCollection {
        $clone = $request->duplicate();
        $this->forceReducedAggregationRequest($clone);

        $navigationId = $this->resolveNavigationId($clone, $listing);
        if ($navigationId !== null) {
            $result = $this->listingRoute
                ->load($navigationId, $clone, $context, new Criteria())
                ->getResult();

            return $result->getAggregations();
        }

        if ($clone->get('search')) {
            $result = $this->searchRoute
                ->load($clone, $context, new Criteria())
                ->getListingResult();

            return $result->getAggregations();
        }

        return null;
    }

    public function forceReducedAggregationRequest(Request $request): void
    {
        $request->request->set('only-aggregations', true);
        $request->request->set('reduce-aggregations', true);
        $request->query->set('only-aggregations', '1');
        $request->query->set('reduce-aggregations', '1');
    }

    public function forceCatalogAggregationRequest(Request $request): void
    {
        $request->request->set('only-aggregations', true);
        $request->request->remove('reduce-aggregations');
        $request->query->set('only-aggregations', '1');
        $request->query->remove('reduce-aggregations');
    }

    private function resolveNavigationId(Request $request, ?EntitySearchResult $listing): ?string
    {
        if ($listing instanceof ProductListingResult) {
            $filters = $listing->getCurrentFilters();
            $fromListing = $filters['navigationId'] ?? null;
            if (\is_string($fromListing) && $fromListing !== '') {
                return $fromListing;
            }
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
