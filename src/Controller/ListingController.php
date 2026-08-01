<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\RoutingException;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class ListingController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        private readonly AbstractProductListingRoute $listingRoute,
        private readonly AbstractProductSearchRoute $searchRoute,
    ) {
        parent::__construct($components);
    }

    #[Route(
        path: '/vi/listing/category/{navigationId}',
        name: 'frontend.views-theme.listing.category',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function category(string $navigationId, Request $request, SalesChannelContext $context): Response
    {
        $result = $this->listingRoute
            ->load($navigationId, $request, $context, new Criteria())
            ->getResult();

        return $this->renderComponent('ViewsTheme:Product:Listing:Results', $this->resultsProps($request, $result));
    }

    #[Route(
        path: '/vi/listing/category/{navigationId}/aggregations',
        name: 'frontend.views-theme.listing.category.aggregations',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function categoryAggregations(string $navigationId, Request $request, SalesChannelContext $context): JsonResponse
    {
        $this->forceAggregationRequest($request);

        $result = $this->listingRoute
            ->load($navigationId, $request, $context, new Criteria())
            ->getResult();

        return $this->aggregationsResponse($result->getAggregations());
    }

    #[Route(
        path: '/vi/listing/search',
        name: 'frontend.views-theme.listing.search',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function search(Request $request, SalesChannelContext $context): Response
    {
        if (!$request->get('search')) {
            throw RoutingException::missingRequestParameter('search');
        }

        $request->request->set('no-aggregations', true);
        $request->query->set('no-aggregations', '1');

        $result = $this->searchRoute
            ->load($request, $context, new Criteria())
            ->getListingResult();

        return $this->renderComponent('ViewsTheme:Product:Listing:Results', $this->resultsProps($request, $result));
    }

    #[Route(
        path: '/vi/listing/search/aggregations',
        name: 'frontend.views-theme.listing.search.aggregations',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function searchAggregations(Request $request, SalesChannelContext $context): JsonResponse
    {
        if (!$request->get('search')) {
            throw RoutingException::missingRequestParameter('search');
        }

        $this->forceAggregationRequest($request);

        $result = $this->searchRoute
            ->load($request, $context, new Criteria())
            ->getListingResult();

        return $this->aggregationsResponse($result->getAggregations());
    }

    /**
     * @param array<string, mixed>|object $aggregations
     */
    private function aggregationsResponse(mixed $aggregations): JsonResponse
    {
        $mapped = [];
        foreach ($aggregations as $aggregation) {
            $mapped[$aggregation->getName()] = $aggregation;
        }

        $response = new JsonResponse($mapped);
        $response->headers->set('x-robots-tag', 'noindex');

        return $response;
    }

    private function forceAggregationRequest(Request $request): void
    {
        $request->request->set('only-aggregations', true);
        $request->request->set('reduce-aggregations', true);
        $request->query->set('only-aggregations', '1');
        $request->query->set('reduce-aggregations', '1');
    }

    /**
     * @return array<string, mixed>
     */
    private function resultsProps(Request $request, mixed $searchResult): array
    {
        $boxLayout = $request->get('boxLayout');
        $referrerCategoryId = $request->get('referrerCategoryId');

        return [
            'searchResult' => $searchResult,
            'boxLayout' => \is_string($boxLayout) && $boxLayout !== '' ? $boxLayout : 'default',
            'referrerCategoryId' => \is_string($referrerCategoryId) && $referrerCategoryId !== ''
                ? $referrerCategoryId
                : null,
        ];
    }
}



