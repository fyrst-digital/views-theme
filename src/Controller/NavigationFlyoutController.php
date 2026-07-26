<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\Content\Category\Service\NavigationLoaderInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class NavigationFlyoutController extends StorefrontController
{
    private const FALLBACK_DEPTH = 3;

    public function __construct(
        private readonly ComponentRendererInterface $components,
        private readonly NavigationLoaderInterface $navigationLoader,
    ) {}

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

        $depth = $context->getSalesChannel()->getNavigationCategoryDepth();
        if ($depth < 1) {
            $depth = self::FALLBACK_DEPTH;
        }

        $navigation = $this->navigationLoader->load(
            $navigationId,
            $context,
            $navigationId,
            $depth,
        );

        $tree = $navigation->getTree();
        if ($tree === []) {
            return new Response('', Response::HTTP_NO_CONTENT);
        }

        return $this->renderComponent('ViewsTheme:Navigation:Flyout', [
            'navigation' => $navigation,
            'category' => $navigation->getActive(),
            'maxDepth' => $depth,
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
