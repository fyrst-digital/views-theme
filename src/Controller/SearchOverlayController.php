<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\Suggest\SuggestPageLoadedHook;
use Shopware\Storefront\Page\Suggest\SuggestPageLoader;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class SearchOverlayController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly SuggestPageLoader $suggestPageLoader,
    ) {
        parent::__construct($components, $htmlRenderer);
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
}
