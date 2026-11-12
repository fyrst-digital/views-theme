<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Controller;

use Webflare\ViewsTheme\Service\ComponentHtmlRenderer;
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
    private const DEFAULT_FEATURE = 'wishlist';

    private const DEFAULT_COOKIE = 'wishlist-enabled';

    /**
     * `featureName` becomes a snippet key segment (`cookie.{featureName}.*`), so no dots.
     */
    private const FEATURE_PATTERN = '/^[A-Za-z0-9_-]+$/';

    private const COOKIE_PATTERN = '/^[A-Za-z0-9._-]+$/';

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
            'featureName' => self::allowed($request, 'featureName', self::FEATURE_PATTERN, self::DEFAULT_FEATURE),
            'cookieName' => self::allowed($request, 'cookieName', self::COOKIE_PATTERN, self::DEFAULT_COOKIE),
        ]);
    }

    /**
     * Query values flow into snippet keys, JSON options and `document.cookie`: allowlist them.
     */
    private static function allowed(Request $request, string $key, string $pattern, string $default): string
    {
        $value = $request->query->get($key);

        return \is_string($value) && preg_match($pattern, $value) === 1 ? $value : $default;
    }
}
