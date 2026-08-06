<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Builds batch filter-options JSON: option list HTML + meta (disabled/count/checked).
 */
final class FilterOptionsPayloadBuilder
{
    public function __construct(
        private readonly FilterFacetPipeline $facetPipeline,
        private readonly ProductListingGateway $gateway,
        private readonly ComponentHtmlRenderer $htmlRenderer,
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
        $catalog = $catalogListing;
        if ($catalog === null) {
            $scope = $this->gateway->resolveScope($request);
            $catalog = $scope !== null
                ? $this->gateway->loadCatalogAggregations($scope, $request, $context)
                : null;
        }

        if ($catalog === null) {
            return ['options' => [], 'meta' => []];
        }

        $facets = $this->facetPipeline->resolveWithAvailability(
            $catalog,
            $request,
            $context,
            true,
        );

        $options = [];
        $meta = [];

        foreach ($facets as $facet) {
            $key = $facet->key();
            if ($key === null) {
                continue;
            }

            $props = $facet->props;

            if ($facet->component === FilterComponents::MULTI_SELECT) {
                $selectedIds = $props['selectedIds'] ?? [];
                if (!\is_array($selectedIds)) {
                    $selectedIds = [];
                }
                $allowedIds = $props['allowedIds'] ?? null;
                $disabled = (bool) ($props['disabled'] ?? false);

                $options[$key] = $this->htmlRenderer->render('ViewsTheme:Filter:MultiSelect:Options', [
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

            if ($facet->component === FilterComponents::BOOLEAN) {
                $meta[$key] = [
                    'disabled' => (bool) ($props['disabled'] ?? false),
                    'checked' => (bool) ($props['checked'] ?? false),
                ];
                continue;
            }

            if ($facet->component === FilterComponents::RATING) {
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
}
