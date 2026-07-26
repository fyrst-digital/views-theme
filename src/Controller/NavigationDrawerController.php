<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Pagelet\Header\HeaderPageletLoaderInterface;
use Shopware\Storefront\Pagelet\Menu\Offcanvas\MenuOffcanvasPageletLoadedHook;
use Shopware\Storefront\Pagelet\Menu\Offcanvas\MenuOffcanvasPageletLoaderInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class NavigationDrawerController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        private readonly MenuOffcanvasPageletLoaderInterface $offcanvasLoader,
        private readonly HeaderPageletLoaderInterface $headerLoader,
    ) {
        parent::__construct($components);
    }

    #[Route(
        path: '/vi/navigation/drawer',
        name: 'frontend.views-theme.navigation.drawer',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function drawer(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->offcanvasLoader->load($request, $context);

        $this->hook(new MenuOffcanvasPageletLoadedHook($page, $context));

        $navigation = $page->getNavigation();
        if ($navigation === null) {
            return new Response('', Response::HTTP_NO_CONTENT);
        }

        $header = $this->headerLoader->load($request, $context);

        return $this->renderComponent('ViewsTheme:Navigation:Drawer', [
            'navigation' => $navigation,
            'languages' => $header->getLanguages(),
            'currencies' => $header->getCurrencies(),
        ]);
    }

    #[Route(
        path: '/vi/navigation/drawer/menu',
        name: 'frontend.views-theme.navigation.drawer.menu',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function menu(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->offcanvasLoader->load($request, $context);

        $this->hook(new MenuOffcanvasPageletLoadedHook($page, $context));

        $navigation = $page->getNavigation();
        if ($navigation === null) {
            return new Response('', Response::HTTP_NO_CONTENT);
        }

        return $this->renderComponent('ViewsTheme:Navigation:Drawer:Menu', [
            'navigation' => $navigation,
        ]);
    }
}
