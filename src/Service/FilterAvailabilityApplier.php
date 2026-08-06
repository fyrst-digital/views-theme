<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Content\Property\PropertyGroupEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\EntityResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\MaxResult;

/**
 * Merges reduced aggregations into catalog facets (disabled / allowedIds / selectedIds).
 * Mirrors MultiSelect/Boolean/Rating applyAvailability JS — empty facets stay visible disabled.
 */
final class FilterAvailabilityApplier
{
    /**
     * @param list<FilterFacet> $facets
     * @param array<string, list<string>> $selectedByParam param => selected ids/values
     *
     * @return list<FilterFacet>
     */
    public function apply(
        array $facets,
        AggregationResultCollection $reduced,
        array $selectedByParam,
    ): array {
        $allowedManufacturer = $this->entityIds($reduced->get('manufacturer'));
        $allowedPropertiesByGroup = $this->propertyOptionIdsByGroup($reduced->get('properties'));
        $ratingMax = $this->maxValue($reduced->get('rating'));

        $out = [];
        foreach ($facets as $facet) {
            $props = $facet->props;
            $component = $facet->component;

            if ($component === FilterComponents::MULTI_SELECT) {
                $name = (string) ($props['name'] ?? '');
                $propertyName = isset($props['propertyName']) ? (string) $props['propertyName'] : null;
                $elementIds = $this->catalogElementIds($props['elements'] ?? []);

                if ($name === 'manufacturer') {
                    $allowed = $allowedManufacturer;
                    $selected = $this->intersectSelected($selectedByParam['manufacturer'] ?? [], $elementIds);
                } elseif ($name === 'properties' && $propertyName !== null && $propertyName !== '') {
                    $allowed = $allowedPropertiesByGroup[$propertyName] ?? [];
                    $selected = $this->intersectSelected($selectedByParam['properties'] ?? [], $elementIds);
                    // Property OR within group: unlock full catalog when any option selected (core parity).
                    if ($selected !== []) {
                        $allowed = $elementIds;
                    }
                } else {
                    $out[] = $facet;
                    continue;
                }

                $unavailable = $allowed === [] && $selected === [];
                $props['elements'] = $this->sortElementsAvailableFirst(
                    $props['elements'] ?? [],
                    $allowed,
                    $selected,
                );
                $props['allowedIds'] = $allowed;
                $props['selectedIds'] = $selected;
                $props['disabled'] = $unavailable;
                unset($props['hidden']);
                $out[] = new FilterFacet($component, $props);
                continue;
            }

            if ($component === FilterComponents::BOOLEAN) {
                $name = (string) ($props['name'] ?? '');
                $selected = ($selectedByParam[$name] ?? []) !== [];
                $max = $name !== '' ? $this->maxValue($reduced->get($name)) : 0.0;
                $available = $max > 0 || $selected;
                $props['disabled'] = !$available;
                $props['checked'] = $selected;
                unset($props['hidden']);
                $out[] = new FilterFacet($component, $props);
                continue;
            }

            if ($component === FilterComponents::RATING) {
                $name = (string) ($props['name'] ?? 'rating');
                $selectedRaw = $selectedByParam[$name][0] ?? null;
                $selected = $selectedRaw !== null && $selectedRaw !== '' ? (string) $selectedRaw : null;
                $unavailable = $ratingMax <= 0 && $selected === null;
                $props['disabled'] = $unavailable;
                $props['allowedMax'] = $ratingMax;
                $props['selectedValue'] = $selected;
                unset($props['hidden']);
                $out[] = new FilterFacet($component, $props);
                continue;
            }

            $out[] = $facet;
        }

        return $out;
    }

    /**
     * @return list<string>|null null when bucket missing (treat as empty allowed)
     */
    private function entityIds(mixed $result): array
    {
        if (!$result instanceof EntityResult) {
            return [];
        }

        $ids = [];
        foreach ($result->getEntities() as $entity) {
            if ($entity instanceof Entity) {
                $id = $entity->getUniqueIdentifier();
                if (\is_string($id) && $id !== '') {
                    $ids[] = $id;
                }
            }
        }

        return $ids;
    }

    /**
     * @return array<string, list<string>> property group id => option ids
     */
    private function propertyOptionIdsByGroup(mixed $result): array
    {
        if (!$result instanceof EntityResult) {
            return [];
        }

        $map = [];
        foreach ($result->getEntities() as $group) {
            if (!$group instanceof PropertyGroupEntity) {
                continue;
            }

            $groupId = $group->getUniqueIdentifier();
            if (!\is_string($groupId) || $groupId === '') {
                continue;
            }

            $ids = [];
            $options = $group->getOptions();
            if ($options !== null) {
                foreach ($options as $option) {
                    if ($option instanceof PropertyGroupOptionEntity) {
                        $id = $option->getUniqueIdentifier();
                        if (\is_string($id) && $id !== '') {
                            $ids[] = $id;
                        }
                    }
                }
            }
            $map[$groupId] = $ids;
        }

        return $map;
    }

    private function maxValue(mixed $result): float
    {
        if (!$result instanceof MaxResult) {
            return 0.0;
        }

        $max = $result->getMax();
        if ($max === null) {
            return 0.0;
        }

        return (float) $max;
    }

    /**
     * @param mixed $elements
     *
     * @return list<string>
     */
    private function catalogElementIds(mixed $elements): array
    {
        $ids = [];
        if (!\is_iterable($elements)) {
            return $ids;
        }

        foreach ($elements as $element) {
            if ($element instanceof Entity) {
                $id = $element->getUniqueIdentifier();
                if (\is_string($id) && $id !== '') {
                    $ids[] = $id;
                }
                continue;
            }
            if (\is_array($element) && isset($element['id']) && \is_string($element['id'])) {
                $ids[] = $element['id'];
            }
        }

        return $ids;
    }

    /**
     * Available (allowed or selected) first; preserve relative order within each bucket.
     *
     * @param mixed $elements
     * @param list<string> $allowedIds
     * @param list<string> $selectedIds
     *
     * @return list<mixed>
     */
    private function sortElementsAvailableFirst(mixed $elements, array $allowedIds, array $selectedIds): array
    {
        if (!\is_iterable($elements)) {
            return [];
        }

        $list = [];
        foreach ($elements as $element) {
            $list[] = $element;
        }

        if ($list === []) {
            return [];
        }

        $available = array_fill_keys([...$allowedIds, ...$selectedIds], true);
        $availableBucket = [];
        $disabledBucket = [];

        foreach ($list as $element) {
            $id = $this->elementId($element);
            if ($id !== null && isset($available[$id])) {
                $availableBucket[] = $element;
            } else {
                $disabledBucket[] = $element;
            }
        }

        return [...$availableBucket, ...$disabledBucket];
    }

    private function elementId(mixed $element): ?string
    {
        if ($element instanceof Entity) {
            $id = $element->getUniqueIdentifier();

            return \is_string($id) && $id !== '' ? $id : null;
        }

        if (\is_array($element) && isset($element['id']) && \is_string($element['id']) && $element['id'] !== '') {
            return $element['id'];
        }

        return null;
    }

    /**
     * @param list<string> $selected
     * @param list<string> $catalogIds
     *
     * @return list<string>
     */
    private function intersectSelected(array $selected, array $catalogIds): array
    {
        if ($selected === [] || $catalogIds === []) {
            return [];
        }

        $catalog = array_fill_keys($catalogIds, true);
        $out = [];
        foreach ($selected as $id) {
            if (isset($catalog[$id])) {
                $out[] = $id;
            }
        }

        return $out;
    }
}
