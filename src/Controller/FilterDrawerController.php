<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\FilterAggregationLoader;
use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\RoutingException;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class FilterDrawerController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        private readonly AbstractProductListingRoute $listingRoute,
        private readonly AbstractProductSearchRoute $searchRoute,
        private readonly FilterAggregationLoader $aggregationLoader,
    ) {
        parent::__construct($components);
    }

    #[Route(
        path: '/vi/filter/drawer/category/{navigationId}',
        name: 'frontend.views-theme.filter.drawer.category',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function category(string $navigationId, Request $request, SalesChannelContext $context): Response
    {
        $this->aggregationLoader->forceCatalogAggregationRequest($request);

        $result = $this->listingRoute
            ->load($navigationId, $request, $context, new Criteria())
            ->getResult();

        return $this->renderComponent('ViewsTheme:Filter:Drawer', [
            'listing' => $result,
            'showActive' => $request->query->getBoolean('viShowActiveFilters', true),
        ]);
    }

    #[Route(
        path: '/vi/filter/drawer/search',
        name: 'frontend.views-theme.filter.drawer.search',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function search(Request $request, SalesChannelContext $context): Response
    {
        if (!$request->get('search')) {
            throw RoutingException::missingRequestParameter('search');
        }

        $this->aggregationLoader->forceCatalogAggregationRequest($request);

        $result = $this->searchRoute
            ->load($request, $context, new Criteria())
            ->getListingResult();

        return $this->renderComponent('ViewsTheme:Filter:Drawer', [
            'listing' => $result,
            'showActive' => $request->query->getBoolean('viShowActiveFilters', true),
        ]);
    }
}
