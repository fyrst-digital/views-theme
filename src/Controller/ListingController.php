<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Fyrst\ViewsTheme\Service\FilterOptionsPayloadBuilder;
use Fyrst\ViewsTheme\Service\ProductListingGateway;
use Fyrst\ViewsTheme\Struct\ListingScope;
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
        ComponentHtmlRenderer $htmlRenderer,
        private readonly ProductListingGateway $gateway,
        private readonly FilterOptionsPayloadBuilder $optionsPayloadBuilder,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/listing/category/{navigationId}',
        name: 'frontend.views-theme.listing.category',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function category(string $navigationId, Request $request, SalesChannelContext $context): Response
    {
        $result = $this->gateway->loadResults(
            ListingScope::category($navigationId),
            $request,
            $context,
        );

        return $this->renderComponent(
            'ViewsTheme:Product:Listing:Results',
            $this->resultsProps($request, $result),
        );
    }

    #[Route(
        path: '/vi/listing/category/{navigationId}/aggregations',
        name: 'frontend.views-theme.listing.category.aggregations',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function categoryAggregations(string $navigationId, Request $request, SalesChannelContext $context): JsonResponse
    {
        $aggs = $this->gateway->loadReducedAggregations(
            ListingScope::category($navigationId),
            $request,
            $context,
        );

        return $this->aggregationsResponse($aggs);
    }

    #[Route(
        path: '/vi/listing/category/{navigationId}/filter-options',
        name: 'frontend.views-theme.listing.category.filter-options',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function categoryFilterOptions(string $navigationId, Request $request, SalesChannelContext $context): JsonResponse
    {
        $request->attributes->set('navigationId', $navigationId);

        return $this->filterOptionsResponse($request, $context);
    }

    #[Route(
        path: '/vi/listing/search',
        name: 'frontend.views-theme.listing.search',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function search(Request $request, SalesChannelContext $context): Response
    {
        $term = $request->get('search');
        if (!\is_string($term) || $term === '') {
            throw RoutingException::missingRequestParameter('search');
        }

        $result = $this->gateway->loadResults(
            ListingScope::search($term),
            $request,
            $context,
        );

        return $this->renderComponent(
            'ViewsTheme:Product:Listing:Results',
            $this->resultsProps($request, $result),
        );
    }

    #[Route(
        path: '/vi/listing/search/aggregations',
        name: 'frontend.views-theme.listing.search.aggregations',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function searchAggregations(Request $request, SalesChannelContext $context): JsonResponse
    {
        $term = $request->get('search');
        if (!\is_string($term) || $term === '') {
            throw RoutingException::missingRequestParameter('search');
        }

        $aggs = $this->gateway->loadReducedAggregations(
            ListingScope::search($term),
            $request,
            $context,
        );

        return $this->aggregationsResponse($aggs);
    }

    #[Route(
        path: '/vi/listing/search/filter-options',
        name: 'frontend.views-theme.listing.search.filter-options',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function searchFilterOptions(Request $request, SalesChannelContext $context): JsonResponse
    {
        if (!$request->get('search')) {
            throw RoutingException::missingRequestParameter('search');
        }

        return $this->filterOptionsResponse($request, $context);
    }

    private function filterOptionsResponse(Request $request, SalesChannelContext $context): JsonResponse
    {
        $payload = $this->optionsPayloadBuilder->build($request, $context);

        $response = new JsonResponse($payload);
        $response->headers->set('x-robots-tag', 'noindex');

        return $response;
    }

    /**
     * @param array<string, mixed>|object|null $aggregations
     */
    private function aggregationsResponse(mixed $aggregations): JsonResponse
    {
        $mapped = [];
        if ($aggregations !== null) {
            foreach ($aggregations as $aggregation) {
                $mapped[$aggregation->getName()] = $aggregation;
            }
        }

        $response = new JsonResponse($mapped);
        $response->headers->set('x-robots-tag', 'noindex');

        return $response;
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
