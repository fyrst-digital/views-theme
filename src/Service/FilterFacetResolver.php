<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\EntityResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\MaxResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\StatsResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Maps listing aggregations to ordered Filter:Panel facet view-models.
 */
final class FilterFacetResolver
{
    public function __construct(
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @return list<FilterFacet>
     */
    public function resolve(?EntitySearchResult $listing): array
    {
        if ($listing === null) {
            return [];
        }

        $aggregations = $listing->getAggregations();
        $facets = [];

        $manufacturer = $this->manufacturerFacet($aggregations->get('manufacturer'));
        if ($manufacturer !== null) {
            $facets[] = $manufacturer;
        }

        foreach ($this->propertyFacets($aggregations->get('properties')) as $facet) {
            $facets[] = $facet;
        }

        $price = $this->priceFacet($aggregations->get('price'));
        if ($price !== null) {
            $facets[] = $price;
        }

        $rating = $this->ratingFacet($aggregations->get('rating'));
        if ($rating !== null) {
            $facets[] = $rating;
        }

        $shippingFree = $this->shippingFreeFacet($aggregations->get('shipping-free'));
        if ($shippingFree !== null) {
            $facets[] = $shippingFree;
        }

        return $facets;
    }

    private function manufacturerFacet(mixed $result): ?FilterFacet
    {
        if (!$result instanceof EntityResult || $result->getEntities()->count() === 0) {
            return null;
        }

        $elements = array_values($result->getEntities()->getElements());
        usort($elements, static function (Entity $a, Entity $b): int {
            return self::entitySortKey($a) <=> self::entitySortKey($b);
        });

        return new FilterFacet('ViewsTheme:Filter:MultiSelect', [
            'name' => 'manufacturer',
            'displayName' => $this->trans('listing.filterManufacturerDisplayName'),
            'elements' => $elements,
        ]);
    }

    /**
     * @return list<FilterFacet>
     */
    private function propertyFacets(mixed $result): array
    {
        if (!$result instanceof EntityResult || $result->getEntities()->count() === 0) {
            return [];
        }

        $facets = [];

        foreach ($result->getEntities() as $property) {
            if (!$property instanceof PropertyGroupEntity) {
                continue;
            }

            $displayName = self::entityDisplayName($property);
            $facets[] = new FilterFacet('ViewsTheme:Filter:MultiSelect', [
                'name' => 'properties',
                'displayName' => $displayName,
                'elements' => $property->getOptions() ?? [],
                'propertyName' => $displayName,
            ]);
        }

        return $facets;
    }

    private function priceFacet(mixed $result): ?FilterFacet
    {
        if (!$result instanceof StatsResult) {
            return null;
        }

        if ($result->getMin() === null || $result->getMax() === null) {
            return null;
        }

        return new FilterFacet('ViewsTheme:Filter:Range', [
            'displayName' => $this->trans('listing.filterPriceDisplayName'),
            'minKey' => 'min-price',
            'maxKey' => 'max-price',
            'min' => 0,
            'max' => $result->getMax(),
        ]);
    }

    private function ratingFacet(mixed $result): ?FilterFacet
    {
        if (!$result instanceof MaxResult) {
            return null;
        }

        $max = $result->getMax();
        if ($max === null || (float) $max <= 0) {
            return null;
        }

        return new FilterFacet('ViewsTheme:Filter:Rating', [
            'displayName' => $this->trans('listing.filterRatingDisplayName'),
            'name' => 'rating',
        ]);
    }

    private function shippingFreeFacet(mixed $result): ?FilterFacet
    {
        if (!$result instanceof MaxResult) {
            return null;
        }

        $max = $result->getMax();
        if ($max === null || (float) $max <= 0) {
            return null;
        }

        return new FilterFacet('ViewsTheme:Filter:Boolean', [
            'name' => 'shipping-free',
            'displayName' => $this->trans('listing.filterFreeShippingDisplayName'),
        ]);
    }

    private function trans(string $id): string
    {
        return strip_tags($this->translator->trans($id));
    }

    private static function entitySortKey(Entity $entity): string
    {
        return mb_strtolower(self::entityDisplayName($entity));
    }

    private static function entityDisplayName(Entity $entity): string
    {
        $translated = $entity->getTranslated();
        if (isset($translated['name']) && \is_string($translated['name'])) {
            return $translated['name'];
        }

        if (method_exists($entity, 'getName')) {
            $name = $entity->getName();
            if (\is_string($name)) {
                return $name;
            }
        }

        return '';
    }
}

