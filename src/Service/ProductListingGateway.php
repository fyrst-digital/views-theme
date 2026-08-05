<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\ListingScope;
use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Single I/O path for theme listing category/search loads (results, catalog aggs, reduced aggs).
 */
final class ProductListingGateway
{
    public function __construct(
        private readonly AbstractProductListingRoute $listingRoute,
        private readonly AbstractProductSearchRoute $searchRoute,
    ) {
    }

    public function loadResults(
        ListingScope $scope,
        Request $request,
        SalesChannelContext $context,
    ): ?EntitySearchResult {
        $clone = $request->duplicate();
        $this->forceNoAggregations($clone);

        return $this->load($scope, $clone, $context);
    }

    public function loadCatalogAggregations(
        ListingScope $scope,
        Request $request,
        SalesChannelContext $context,
    ): ?EntitySearchResult {
        $clone = $request->duplicate();
        $this->forceCatalogAggregationRequest($clone);

        return $this->load($scope, $clone, $context);
    }

    public function loadReducedAggregations(
        ListingScope $scope,
        Request $request,
        SalesChannelContext $context,
    ): ?AggregationResultCollection {
        $clone = $request->duplicate();
        $this->forceReducedAggregationRequest($clone);

        $result = $this->load($scope, $clone, $context);

        return $result?->getAggregations();
    }

    /**
     * Resolve scope from request + optional listing DTO (unified navigationId sources).
     */
    public function resolveScope(Request $request, ?EntitySearchResult $listing = null): ?ListingScope
    {
        $navigationId = $this->resolveNavigationId($request, $listing);
        if ($navigationId !== null) {
            return ListingScope::category($navigationId);
        }

        $search = $request->get('search');
        if (\is_string($search) && $search !== '') {
            return ListingScope::search($search);
        }

        return null;
    }

    public function forceNoAggregations(Request $request): void
    {
        $request->request->set('no-aggregations', true);
        $request->query->set('no-aggregations', '1');
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

    private function load(
        ListingScope $scope,
        Request $request,
        SalesChannelContext $context,
    ): ?EntitySearchResult {
        if ($scope->isCategory() && $scope->navigationId !== null) {
            return $this->listingRoute
                ->load($scope->navigationId, $request, $context, new Criteria())
                ->getResult();
        }

        if ($scope->isSearch()) {
            if (!$request->get('search') && $scope->searchTerm !== null) {
                $request->query->set('search', $scope->searchTerm);
                $request->request->set('search', $scope->searchTerm);
            }

            return $this->searchRoute
                ->load($request, $context, new Criteria())
                ->getListingResult();
        }

        return null;
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

        $fromRoute = $request->attributes->get('_route_params');
        if (\is_array($fromRoute) && isset($fromRoute['navigationId']) && \is_string($fromRoute['navigationId']) && $fromRoute['navigationId'] !== '') {
            return $fromRoute['navigationId'];
        }

        return null;
    }
}
