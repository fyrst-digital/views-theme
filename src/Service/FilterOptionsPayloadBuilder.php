<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

/**
 * Builds batch filter-options JSON: option list HTML + meta (disabled/count/checked).
 */
final class FilterOptionsPayloadBuilder
{
    public function __construct(
        private readonly FilterFacetResolver $facetResolver,
        private readonly FilterAggregationLoader $aggregationLoader,
        private readonly FilterAvailabilityApplier $availabilityApplier,
        private readonly AbstractProductListingRoute $listingRoute,
        private readonly AbstractProductSearchRoute $searchRoute,
        private readonly ComponentRendererInterface $components,
    ) {
    }

    /**
     * @return array{options: array<string, string>, meta: array<string, array<string, mixed>>}
     */
    public function build(
        Request $request,
        SalesChannelContext $context,
        ?EntitySearchResult $catalogListing = null,
    ): array {
        $catalog = $catalogListing ?? $this->loadCatalog($request, $context);
        if ($catalog === null) {
            return ['options' => [], 'meta' => []];
        }

        $facets = $this->facetResolver->resolve($catalog);
        $selected = $this->availabilityApplier->selectedFromRequest($request);

        $reduced = $this->aggregationLoader->loadReduced($request, $context, $catalog);
        if ($reduced !== null) {
            $facets = $this->availabilityApplier->apply($facets, $reduced, $selected);
        }

        $options = [];
        $meta = [];

        foreach ($facets as $facet) {
            $key = $this->facetKey($facet);
            if ($key === null) {
                continue;
            }

            $props = $facet->props;

            if ($facet->component === 'ViewsTheme:Filter:MultiSelect') {
                $selectedIds = $props['selectedIds'] ?? [];
                if (!\is_array($selectedIds)) {
                    $selectedIds = [];
                }
                $allowedIds = $props['allowedIds'] ?? null;
                $disabled = (bool) ($props['disabled'] ?? false);

                $options[$key] = $this->components->createAndRender('ViewsTheme:Filter:MultiSelect:Options', [
                    'displayName' => $props['displayName'] ?? null,
                    'elements' => $props['elements'] ?? [],
                    'allowedIds' => $allowedIds,
                    'selectedIds' => $selectedIds,
                    'filterKey' => $key,
                ]);

                $meta[$key] = [
                    'disabled' => $disabled,
                    'count' => \count($selectedIds),
                ];
                continue;
            }

            if ($facet->component === 'ViewsTheme:Filter:Boolean') {
                $meta[$key] = [
                    'disabled' => (bool) ($props['disabled'] ?? false),
                    'checked' => (bool) ($props['checked'] ?? false),
                ];
                continue;
            }

            if ($facet->component === 'ViewsTheme:Filter:Rating') {
                $selectedValue = $props['selectedValue'] ?? null;
                $meta[$key] = [
                    'disabled' => (bool) ($props['disabled'] ?? false),
                    'allowedMax' => $props['allowedMax'] ?? null,
                    'selectedValue' => $selectedValue,
                    'count' => $selectedValue !== null && $selectedValue !== '' ? 1 : 0,
                ];
            }
        }

        return ['options' => $options, 'meta' => $meta];
    }

    private function loadCatalog(Request $request, SalesChannelContext $context): ?EntitySearchResult
    {
        $clone = $request->duplicate();
        $this->aggregationLoader->forceCatalogAggregationRequest($clone);

        $navigationId = $this->resolveNavigationId($clone);
        if ($navigationId !== null) {
            return $this->listingRoute
                ->load($navigationId, $clone, $context, new Criteria())
                ->getResult();
        }

        if ($clone->get('search')) {
            return $this->searchRoute
                ->load($clone, $context, new Criteria())
                ->getListingResult();
        }

        return null;
    }

    private function resolveNavigationId(Request $request): ?string
    {
        $fromAttributes = $request->attributes->get('navigationId');
        if (\is_string($fromAttributes) && $fromAttributes !== '') {
            return $fromAttributes;
        }

        $fromQuery = $request->query->get('navigationId');
        if (\is_string($fromQuery) && $fromQuery !== '') {
            return $fromQuery;
        }

        $fromRoute = $request->attributes->get('_route_params');
        if (\is_array($fromRoute) && isset($fromRoute['navigationId']) && \is_string($fromRoute['navigationId'])) {
            return $fromRoute['navigationId'];
        }

        return null;
    }

    private function facetKey(FilterFacet $facet): ?string
    {
        $props = $facet->props;

        if ($facet->component === 'ViewsTheme:Filter:MultiSelect') {
            $name = (string) ($props['name'] ?? '');
            $propertyName = isset($props['propertyName']) ? (string) $props['propertyName'] : '';
            if ($name === 'properties' && $propertyName !== '') {
                return 'properties:' . $propertyName;
            }
            if ($name !== '') {
                return $name;
            }

            return null;
        }

        if ($facet->component === 'ViewsTheme:Filter:Boolean') {
            $name = (string) ($props['name'] ?? '');

            return $name !== '' ? $name : null;
        }

        if ($facet->component === 'ViewsTheme:Filter:Rating') {
            $name = (string) ($props['name'] ?? 'rating');

            return $name !== '' ? $name : null;
        }

        return null;
    }
}
