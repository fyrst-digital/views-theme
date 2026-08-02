<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Filter;

use Fyrst\ViewsTheme\Service\FilterFacetResolver;
use Fyrst\ViewsTheme\Struct\FilterFacet;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Filter:Panel — facet list from listing aggregations; Twig only composes.
 */
#[AsTwigComponent]
class Panel
{
    public ?EntitySearchResult $listing = null;

    public bool $ariaLiveUpdates = true;

    public bool $showHeader = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<FilterFacet>
     */
    public array $facets = [];

    public function __construct(
        private readonly FilterFacetResolver $filterFacetResolver,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->facets = $this->filterFacetResolver->resolve($this->listing);
    }
}
