<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Service;

use Fyrst\ViewsTheme\Service\FilterAvailabilityApplier;
use Fyrst\ViewsTheme\Service\FilterComponents;
use Fyrst\ViewsTheme\Struct\FilterFacet;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\EntityResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\MaxResult;

final class FilterAvailabilityApplierTest extends TestCase
{
    private FilterAvailabilityApplier $applier;

    protected function setUp(): void
    {
        $this->applier = new FilterAvailabilityApplier();
    }

    public function testManufacturerAllowedIdsFromReduced(): void
    {
        $facets = [
            new FilterFacet(FilterComponents::MULTI_SELECT, [
                'name' => 'manufacturer',
                'elements' => [
                    ['id' => 'm1'],
                    ['id' => 'm2'],
                    ['id' => 'm3'],
                ],
            ]),
        ];

        $reduced = new AggregationResultCollection([
            new EntityResult('manufacturer', $this->entityCollection(['m1', 'm3'])),
        ]);

        $out = $this->applier->apply($facets, $reduced, ['manufacturer' => []]);
        $props = $out[0]->props;

        self::assertSame(['m1', 'm3'], $props['allowedIds']);
        self::assertFalse($props['disabled']);
        self::assertSame(['m1', 'm3', 'm2'], array_column($props['elements'], 'id'));
    }

    public function testManufacturerDisabledWhenEmptyAndUnselected(): void
    {
        $facets = [
            new FilterFacet(FilterComponents::MULTI_SELECT, [
                'name' => 'manufacturer',
                'elements' => [
                    ['id' => 'm1'],
                ],
            ]),
        ];

        $reduced = new AggregationResultCollection([
            new EntityResult('manufacturer', new EntityCollection()),
        ]);

        $out = $this->applier->apply($facets, $reduced, ['manufacturer' => []]);

        self::assertTrue($out[0]->props['disabled']);
        self::assertSame([], $out[0]->props['allowedIds']);
    }

    public function testPropertyGroupOrUnlockWhenSelected(): void
    {
        $groupId = 'g1';
        $facets = [
            new FilterFacet(FilterComponents::MULTI_SELECT, [
                'name' => 'properties',
                'propertyName' => $groupId,
                'elements' => [
                    ['id' => 'o1'],
                    ['id' => 'o2'],
                    ['id' => 'o3'],
                ],
            ]),
        ];

        // Reduced only returns o1 — without unlock, o2/o3 would be locked.
        $reduced = new AggregationResultCollection([
            new EntityResult('properties', new EntityCollection()),
        ]);

        $out = $this->applier->apply($facets, $reduced, [
            'properties' => ['o2'],
        ]);

        $props = $out[0]->props;
        self::assertSame(['o2'], $props['selectedIds']);
        // OR unlock: full catalog allowed when group has selection
        self::assertSame(['o1', 'o2', 'o3'], $props['allowedIds']);
        self::assertFalse($props['disabled']);
    }

    public function testBooleanDisabledWhenUnavailable(): void
    {
        $facets = [
            new FilterFacet(FilterComponents::BOOLEAN, [
                'name' => 'shipping-free',
            ]),
        ];

        $reduced = new AggregationResultCollection([
            new MaxResult('shipping-free', 0),
        ]);

        $out = $this->applier->apply($facets, $reduced, ['shipping-free' => []]);

        self::assertTrue($out[0]->props['disabled']);
        self::assertFalse($out[0]->props['checked']);
    }

    public function testRatingDisabledWhenUnavailable(): void
    {
        $facets = [
            new FilterFacet(FilterComponents::RATING, [
                'name' => 'rating',
            ]),
        ];

        $reduced = new AggregationResultCollection([
            new MaxResult('rating', 0),
        ]);

        $out = $this->applier->apply($facets, $reduced, ['rating' => []]);

        self::assertTrue($out[0]->props['disabled']);
        self::assertNull($out[0]->props['selectedValue']);
    }

    /**
     * @param list<string> $ids
     */
    private function entityCollection(array $ids): EntityCollection
    {
        $entities = [];
        foreach ($ids as $id) {
            $entity = new Entity();
            $entity->setUniqueIdentifier($id);
            $entities[] = $entity;
        }

        return new EntityCollection($entities);
    }
}
