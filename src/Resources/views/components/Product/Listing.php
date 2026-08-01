<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Listing — owner options + layout/referrer defaults; Twig composes Results.
 */
#[AsTwigComponent]
class Listing
{
    public mixed $searchResult = null;

    public ?string $resultsUrl = null;

    public ?string $aggregationsUrl = null;

    /**
     * @var array<string, mixed>
     */
    public array $params = [];

    public mixed $sidebar = false;

    public string $boxLayout = 'default';

    public bool $ariaLiveUpdates = true;

    public mixed $disableEmptyFilter = null;

    public ?string $referrerCategoryId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var array<string, mixed>
     */
    public array $componentOptions = [];

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly SystemConfigService $systemConfigService,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->boxLayout === '' || $this->boxLayout === 'standard') {
            $this->boxLayout = 'default';
        }

        $salesChannelId = $this->salesChannelContext()?->getSalesChannelId();

        if ($this->disableEmptyFilter === null) {
            $this->disableEmptyFilter = (bool) $this->systemConfigService->get(
                'core.listing.disableEmptyFilterOptions',
                $salesChannelId,
            );
        } else {
            $this->disableEmptyFilter = (bool) $this->disableEmptyFilter;
        }

        if ($this->referrerCategoryId === null
            && (bool) $this->systemConfigService->get(
                'core.listing.buildBreadcrumbByReferrerCategory',
                $salesChannelId,
            )
        ) {
            $navigationId = $this->navigationId();
            if ($navigationId !== null && $navigationId !== '') {
                $this->referrerCategoryId = $navigationId;
            }
        }

        if ($this->resultsUrl === null && $this->searchResult instanceof ProductListingResult) {
            $this->resultsUrl = $this->resolveResultsUrl();
            $this->aggregationsUrl = $this->resolveAggregationsUrl();
        }

        $baseParams = $this->params === [] ? new \stdClass() : $this->params;

        $this->componentOptions = [
            'resultsUrl' => $this->resultsUrl,
            'aggregationsUrl' => $this->aggregationsUrl,
            'baseParams' => $baseParams,
            'display' => [
                'boxLayout' => $this->boxLayout,
                'referrerCategoryId' => $this->referrerCategoryId,
            ],
            'disableEmptyFilter' => (bool) $this->disableEmptyFilter,
            'ariaLiveUpdates' => $this->ariaLiveUpdates,
            'history' => true,
            'resultsComponent' => 'ViewsTheme:Product:Listing:Results',
            'changedEvent' => 'ViewsTheme:Listing:Changed',
            'loadingEvent' => 'ViewsTheme:Listing:Loading',
            'scrollOffset' => 15,
        ];
    }

    private function resolveResultsUrl(): ?string
    {
        return $this->resultsUrl;
    }

    private function resolveAggregationsUrl(): ?string
    {
        return $this->aggregationsUrl;
    }

    private function salesChannelContext(): ?SalesChannelContext
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);

        return $context instanceof SalesChannelContext ? $context : null;
    }

    private function navigationId(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
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
