<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\Checkout\Cart\CheckoutCartPageLoadedHook;
use Shopware\Storefront\Page\Checkout\Cart\CheckoutCartPageLoader;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class CartDrawerController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly CheckoutCartPageLoader $cartPageLoader,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/cart/drawer',
        name: 'frontend.views-theme.cart.drawer',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function drawer(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->cartPageLoader->load($request, $context);

        $this->hook(new CheckoutCartPageLoadedHook($page, $context));

        return $this->renderComponent('ViewsTheme:Cart:Drawer', [
            'page' => $page,
        ]);
    }
}
