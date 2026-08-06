<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Loads reduced aggregations for filter availability via ProductListingGateway.
 */
final class FilterAggregationLoader
{
    public function __construct(
        private readonly ProductListingGateway $gateway,
    ) {
    }

    public function loadReduced(
        Request $request,
        SalesChannelContext $context,
        ?EntitySearchResult $listing = null,
    ): ?AggregationResultCollection {
        $scope = $this->gateway->resolveScope($request, $listing);
        if ($scope === null) {
            return null;
        }

        return $this->gateway->loadReducedAggregations($scope, $request, $context);
    }

    public function forceReducedAggregationRequest(Request $request): void
    {
        $this->gateway->forceReducedAggregationRequest($request);
    }

    public function forceCatalogAggregationRequest(Request $request): void
    {
        $this->gateway->forceCatalogAggregationRequest($request);
    }
}
