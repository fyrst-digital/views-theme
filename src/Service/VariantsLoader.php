<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionCollection;
use Shopware\Core\Content\Property\PropertyGroupCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductCollection;
use Shopware\Core\System\SalesChannel\Entity\SalesChannelRepository;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class VariantsLoader
{
    /**
     * @param SalesChannelRepository<SalesChannelProductCollection> $productRepository
     */
    public function __construct(
        private readonly SalesChannelRepository $productRepository,
    ) {
    }

    public function countVariantsByParentId(
        string $parentId,
        SalesChannelContext $context,
    ): int {
        $criteria = (new Criteria())
            ->addFilter(new EqualsFilter('parentId', $parentId))
            ->setLimit(1)
            ->setTotalCountMode(Criteria::TOTAL_COUNT_MODE_EXACT);

        $criteria->setTitle('views-theme::variants-grid-count-variants');

        $result = $this->productRepository->search($criteria, $context);

        return $result->getTotal();
    }

    public function loadVariantsPageByParentId(
        string $parentId,
        int $offset,
        int $limit,
        SalesChannelContext $context,
    ): SalesChannelProductCollection {
        $criteria = $this->createVariantCriteria($parentId)
            ->setOffset($offset)
            ->setLimit($limit);

        $criteria->setTitle('views-theme::variants-grid-load-variants-page');

        $result = $this->productRepository->search($criteria, $context);

        /** @var SalesChannelProductCollection $variants */
        $variants = $result->getEntities();

        return $variants;
    }

    private function createVariantCriteria(string $parentId): Criteria
    {
        return (new Criteria())
            ->addFilter(new EqualsFilter('parentId', $parentId))
            ->addAssociation('options.group')
            ->addAssociation('options.media')
            ->addAssociation('cover')
            ->addAssociation('calculatedPrices')
            ->addSorting(new FieldSorting('productNumber', FieldSorting::ASCENDING));
    }

    /**
     * Extracts the configurator groups (columns) from the loaded variants.
     */
    public function extractConfiguratorGroups(SalesChannelProductCollection $variants): PropertyGroupCollection
    {
        $groups = [];

        foreach ($variants as $variant) {
            $options = $variant->getOptions();
            if ($options === null) {
                continue;
            }

            foreach ($options as $option) {
                $group = $option->getGroup();
                if ($group === null) {
                    continue;
                }

                $groupId = $group->getId();
                if (!isset($groups[$groupId])) {
                    $groups[$groupId] = $group;
                }

                $existingOptions = $groups[$groupId]->getOptions();
                if ($existingOptions === null) {
                    $existingOptions = new PropertyGroupOptionCollection();
                    $groups[$groupId]->setOptions($existingOptions);
                }

                if (!$existingOptions->has($option->getId())) {
                    $existingOptions->add($option);
                }
            }
        }

        $collection = new PropertyGroupCollection($groups);
        $collection->sortByPositions();

        return $collection;
    }
}
