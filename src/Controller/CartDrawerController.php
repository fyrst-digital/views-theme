<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\Checkout\Cart\CheckoutCartPageLoader;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class CartDrawerController extends StorefrontController
{
    public function __construct(
        private readonly ComponentRendererInterface $components,
        private readonly CheckoutCartPageLoader $cartPageLoader,
    ) {}

    #[Route(
        path: '/vi/cart/drawer',
        name: 'frontend.views-theme.cart.drawer',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function drawer(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->cartPageLoader->load($request, $context);

        return $this->renderComponent('ViewsTheme:Cart:Drawer', [
            'page' => $page,
        ]);
    }

    #[Route(
        path: '/vi/cart/drawer/partials',
        name: 'frontend.views-theme.cart.drawer.partials',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function partials(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->cartPageLoader->load($request, $context);

        return $this->renderComponent('ViewsTheme:Cart:Drawer:Partials', [
            'page' => $page,
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
