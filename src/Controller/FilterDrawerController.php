<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Fyrst\ViewsTheme\Service\ProductListingGateway;
use Fyrst\ViewsTheme\Struct\ListingScope;
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
        ComponentHtmlRenderer $htmlRenderer,
        private readonly ProductListingGateway $gateway,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/filter/drawer/category/{navigationId}',
        name: 'frontend.views-theme.filter.drawer.category',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function category(string $navigationId, Request $request, SalesChannelContext $context): Response
    {
        $result = $this->gateway->loadCatalogAggregations(
            ListingScope::category($navigationId),
            $request,
            $context,
        );

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
        $term = $request->get('search');
        if (!\is_string($term) || $term === '') {
            throw RoutingException::missingRequestParameter('search');
        }

        $result = $this->gateway->loadCatalogAggregations(
            ListingScope::search($term),
            $request,
            $context,
        );

        return $this->renderComponent('ViewsTheme:Filter:Drawer', [
            'listing' => $result,
            'showActive' => $request->query->getBoolean('viShowActiveFilters', true),
        ]);
    }
}
