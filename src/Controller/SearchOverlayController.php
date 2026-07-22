<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\Suggest\SuggestPageLoadedHook;
use Shopware\Storefront\Page\Suggest\SuggestPageLoader;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class SearchOverlayController extends StorefrontController
{
    public function __construct(
        private readonly ComponentRendererInterface $components,
        private readonly SuggestPageLoader $suggestPageLoader,
    ) {}

    #[Route(
        path: '/vi/search/overlay',
        name: 'frontend.views-theme.search.overlay',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function overlay(Request $request, SalesChannelContext $context): Response
    {
        $searchTerm = $request->query->getString('search');
        $minSearchLength = $request->query->get('minSearchLength');

        $props = [];

        if ($searchTerm !== '') {
            $props['searchTerm'] = $searchTerm;
        }

        if ($minSearchLength !== null && $minSearchLength !== '') {
            $props['minSearchLength'] = (int) $minSearchLength;
        }

        return $this->renderComponent('ViewsTheme:Search:Overlay', $props);
    }

    #[Route(
        path: '/vi/search/suggest',
        name: 'frontend.views-theme.search.suggest',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function suggest(Request $request, SalesChannelContext $context): Response
    {
        if (!$request->request->has('no-aggregations')) {
            $request->request->set('no-aggregations', true);
        }

        $page = $this->suggestPageLoader->load($request, $context);

        $this->hook(new SuggestPageLoadedHook($page, $context));

        return $this->renderComponent('ViewsTheme:Search:Suggest', [
            'searchResult' => $page->getSearchResult(),
            'searchTerm' => $page->getSearchTerm(),
        ]);
    }

    /**
     * @param array<string, mixed> $props
     */
    private function renderComponent(string $name, array $props = []): Response
    {
        $response = new Response($this->components->createAndRender($name, $props));
        $response->headers->set('x-robots-tag', 'noindex');
        $response->headers->set('Content-Type', 'text/html; charset=UTF-8');

        return $response;
    }
}
