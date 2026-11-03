<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Core\Content\Cookie\SalesChannel\AbstractCookieRoute;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

/**
 * Lazy drawer shells of the cookie consent: the cookie manager and the per-feature consent request.
 */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class CookieController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly AbstractCookieRoute $cookieRoute,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/cookie/manager',
        name: 'frontend.views-theme.cookie.manager',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function manager(Request $request, SalesChannelContext $context): Response
    {
        return $this->renderComponent('ViewsTheme:Cookie:Manager', [
            'groups' => $this->cookieRoute->getCookieGroups($request, $context)->getCookieGroups(),
        ]);
    }

    #[Route(
        path: '/vi/cookie/consent',
        name: 'frontend.views-theme.cookie.consent',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function consent(Request $request): Response
    {
        return $this->renderComponent('ViewsTheme:Cookie:Consent', [
            'featureName' => $request->query->getString('featureName', 'wishlist'),
            'cookieName' => $request->query->getString('cookieName', 'wishlist-enabled'),
        ]);
    }
}
