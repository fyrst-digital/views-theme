<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\Content\Category\Service\NavigationLoaderInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class NavigationFlyoutController extends AbstractComponentController
{
    private const FALLBACK_DEPTH = 3;

    public function __construct(
        ComponentRendererInterface $components,
        private readonly NavigationLoaderInterface $navigationLoader,
    ) {
        parent::__construct($components);
    }

    #[Route(
        path: '/vi/navigation/flyout/{navigationId}',
        name: 'frontend.views-theme.navigation.flyout',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function flyout(string $navigationId, SalesChannelContext $context): Response
    {
        if ($navigationId === '') {
            return new Response('', Response::HTTP_BAD_REQUEST);
        }

        $scDepth = $context->getSalesChannel()->getNavigationCategoryDepth();
        if ($scDepth < 1) {
            $scDepth = self::FALLBACK_DEPTH;
        }

        // Bar already consumes level 1; flyout shows remaining levels under the bar item.
        // Shopware loadLevels loads (depth + 1) descendant levels for a root → loaderDepth = flyoutLevels - 1.
        $flyoutLevels = max(0, $scDepth - 1);
        if ($flyoutLevels < 1) {
            return new Response('', Response::HTTP_NO_CONTENT);
        }

        $loaderDepth = max(0, $flyoutLevels - 1);
        $twigMaxDepth = $loaderDepth;

        $navigation = $this->navigationLoader->load(
            $navigationId,
            $context,
            $navigationId,
            $loaderDepth,
        );

        $tree = $navigation->getTree();
        if ($tree === []) {
            return new Response('', Response::HTTP_NO_CONTENT);
        }

        return $this->renderComponent('ViewsTheme:Navigation:Flyout', [
            'navigation' => $navigation,
            'category' => $navigation->getActive(),
            'maxDepth' => $twigMaxDepth,
        ]);
    }
}
